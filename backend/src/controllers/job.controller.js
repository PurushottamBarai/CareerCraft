import { db } from "../db/database.js";

export const getEmployerJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, 
              COUNT(DISTINCT a.id) as applicationCount
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.jobId
       WHERE j.employerId = ?
       GROUP BY j.id
       ORDER BY j.createdAt DESC`,
      [req.user.id],
    );

    const processedJobs = jobs.map((job) => ({
      ...job,
      skills: typeof job.skills === "string" ? JSON.parse(job.skills) : job.skills,
    }));

    res.json(processedJobs);
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const studentId = req.user.id;
    const [jobs] = await db.query(
      `SELECT j.*, 
              u.firstName as employerFirstName, 
              u.lastName as employerLastName,
              e.companyName,
              CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END as hasApplied
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       INNER JOIN employer_profiles e ON u.id = e.userId
       LEFT JOIN applications a ON j.id = a.jobId AND a.studentId = ?
       WHERE j.isActive = TRUE
       ORDER BY j.createdAt DESC`,
      [studentId],
    );

    const processedJobs = jobs.map((job) => {
      let parsedSkills = job.skills;
      if (typeof job.skills === "string") {
        try {
          parsedSkills = JSON.parse(job.skills);
        } catch (e) {
          console.error(`Invalid JSON in skills for job ${job.id}:`, e);
          parsedSkills = [];
        }
      }
      return {
        ...job,
        hasApplied: !!job.hasApplied,
        skills: parsedSkills,
      };
    });

    res.json(processedJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const createJob = async (req, res) => {
  try {
    const { title, description, skills, experienceYears, experienceMonths, location, salary } = req.body;



    const [result] = await db.query(
      `INSERT INTO jobs (employerId, title, description, skills, experienceYears, experienceMonths, location, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, JSON.stringify(skills), experienceYears || 0, experienceMonths || 0, location, salary || null],
    );

    res.status(201).json({ message: "Job posted successfully", jobId: result.insertId });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Failed to post job", error: error.message });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const jobId = req.params.id;
    const employerId = req.user.id;

    const [jobs] = await db.query(
      "SELECT id FROM jobs WHERE id = ? AND employerId = ?",
      [jobId, employerId],
    );

    if (jobs.length === 0) {
      return res.status(404).json({ message: "Job not found or unauthorized to delete" });
    }

    await db.query("DELETE FROM jobs WHERE id = ?", [jobId]);

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Failed to delete job", error: error.message });
  }
};
