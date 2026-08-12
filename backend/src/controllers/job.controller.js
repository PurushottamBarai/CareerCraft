import { db } from "../db/database.js";

const parseSkills = (skills) => {
  if (typeof skills === "string") {
    try {
      return JSON.parse(skills);
    } catch (e) {
      return [];
    }
  }
  return Array.isArray(skills) ? skills : [];
};

export const getEmployerJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, COUNT(DISTINCT a.id) as applicationCount
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.jobId
       WHERE j.employerId = ?
       GROUP BY j.id
       ORDER BY j.createdAt DESC`,
      [req.user.id],
    );

    res.json(jobs.map((job) => ({ ...job, skills: parseSkills(job.skills) })));
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, 
              u.firstName as employerFirstName, 
              u.lastName as employerLastName,
              e.companyName,
              CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END as hasApplied
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       LEFT JOIN employer_profiles e ON u.id = e.userId
       LEFT JOIN applications a ON j.id = a.jobId AND a.studentId = ?
       ORDER BY j.createdAt DESC`,
      [req.user.id],
    );

    res.json(
      jobs.map((job) => ({
        ...job,
        hasApplied: !!job.hasApplied,
        skills: parseSkills(job.skills),
      })),
    );
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
    const [result] = await db.query(
      "DELETE FROM jobs WHERE id = ? AND employerId = ?",
      [req.params.id, req.user.id],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Job not found or unauthorized" });
    }

    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Failed to delete job", error: error.message });
  }
};
