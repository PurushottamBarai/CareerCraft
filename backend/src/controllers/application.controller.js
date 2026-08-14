import { db } from "../db/database.js";
import { getFormattedDateTime } from "../utils/date.util.js";

export const getJobApplications = async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT a.*, 
              s.name as studentName, 
              s.name as studentFirstName,
              s.email as studentEmail,
              s.phone,
              s.college,
              s.course,
              s.graduationYear
       FROM applications a
       INNER JOIN students s ON a.studentId = s.id
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.jobId = ? AND j.companyId = ?
       ORDER BY a.id DESC`,
      [req.params.jobId, req.user.id],
    );

    res.json(applications);
  } catch (error) {
    console.error("Error fetching job applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const getStudentApplications = async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT a.*, 
              j.jobTitle,
              j.jobTitle as title,
              j.company,
              j.company as companyName
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.studentId = ?
       ORDER BY a.id DESC`,
      [req.user.id],
    );

    res.json(applications);
  } catch (error) {
    console.error("Error fetching student applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const submitApplication = async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    if (!jobId) return res.status(400).json({ message: "Job ID is required" });

    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [existing] = await db.query(
      "SELECT id FROM applications WHERE jobId = ? AND studentId = ?",
      [jobId, req.user.id],
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "You have already applied" });
    }

    const appliedDate = getFormattedDateTime();

    const [result] = await db.query(
      `INSERT INTO applications (jobId, studentId, resumePath, coverLetter, appliedDate)
       VALUES (?, ?, ?, ?, ?)`,
      [jobId, req.user.id, resumePath, coverLetter || null, appliedDate],
    );

    res.status(201).json({ message: "Application submitted successfully", applicationId: result.insertId });
  } catch (error) {
    console.error("Error submitting application:", error);
    res.status(500).json({ message: "Failed to submit application", error: error.message });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    const [applications] = await db.query(
      `SELECT a.*, j.companyId 
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.id = ?`,
      [applicationId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (applications[0].companyId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await db.query(
      "UPDATE applications SET status = ? WHERE id = ?",
      [status, applicationId],
    );

    res.json({ message: "Application status updated" });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};
