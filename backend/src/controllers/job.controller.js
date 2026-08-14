import { db } from "../db/database.js";
import { getFormattedDateTime } from "../utils/date.util.js";

const parseSkills = (skills) => {
  if (typeof skills === "string") {
    try {
      return JSON.parse(skills);
    } catch (e) {
      return [skills];
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
       WHERE j.companyId = ?
       GROUP BY j.id
       ORDER BY j.id DESC`,
      [req.user.id],
    );

    res.json(
      jobs.map((job) => ({
        ...job,
        title: job.jobTitle,
        skills: parseSkills(job.skillsRequired),
        skillsRequired: parseSkills(job.skillsRequired),
      })),
    );
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    const [jobs] = await db.query(
      `SELECT j.*, 
              c.name as companyName,
              CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END as hasApplied
       FROM jobs j
       INNER JOIN companies c ON j.companyId = c.id
       LEFT JOIN applications a ON j.id = a.jobId AND a.studentId = ?
       WHERE j.active = TRUE
       ORDER BY j.id DESC`,
      [userId],
    );

    res.json(
      jobs.map((job) => ({
        ...job,
        title: job.jobTitle,
        company: job.company || job.companyName,
        hasApplied: !!job.hasApplied,
        skills: parseSkills(job.skillsRequired),
        skillsRequired: parseSkills(job.skillsRequired),
      })),
    );
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const createJob = async (req, res) => {
  try {
    const { jobTitle, title, company, location, skillsRequired, skills, salary, active } = req.body;
    const finalTitle = jobTitle || title;
    const finalSkills = skillsRequired || skills || [];

    // Fetch company name if not passed
    let companyName = company;
    if (!companyName) {
      const [compRows] = await db.query("SELECT name FROM companies WHERE id = ?", [req.user.id]);
      companyName = compRows[0]?.name || "Company";
    }

    const regDate = getFormattedDateTime();

    const [result] = await db.query(
      `INSERT INTO jobs (companyId, jobTitle, company, location, skillsRequired, salary, active, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        finalTitle,
        companyName,
        location,
        JSON.stringify(Array.isArray(finalSkills) ? finalSkills : [finalSkills]),
        salary || "Not Disclosed",
        active !== undefined ? active : true,
        regDate,
      ],
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
      "DELETE FROM jobs WHERE id = ? AND companyId = ?",
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
