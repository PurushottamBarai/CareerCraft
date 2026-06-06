import { db } from "../db/database.js";

export const getJobApplications = async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT a.*, 
              s.firstName as studentFirstName, 
              s.lastName as studentLastName,
              s.email as studentEmail,
              s.phone,
              sp.college,
              sp.course
       FROM applications a
       INNER JOIN users s ON a.studentId = s.id
       INNER JOIN student_profiles sp ON s.id = sp.userId
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.jobId = ? AND j.employerId = ?
       ORDER BY a.appliedDate DESC`,
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
              j.title as jobTitle,
              u.firstName as employerFirstName,
              u.lastName as employerLastName,
              e.companyName
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       INNER JOIN users u ON j.employerId = u.id
       INNER JOIN employer_profiles e ON u.id = e.userId
       WHERE a.studentId = ?
       ORDER BY a.appliedDate DESC`,
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
    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;



    const [existing] = await db.query(
      "SELECT id FROM applications WHERE jobId = ? AND studentId = ?",
      [jobId, req.user.id],
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "You have already applied to this job" });
    }

    const [result] = await db.query(
      `INSERT INTO applications (jobId, studentId, resumePath, coverLetter)
       VALUES (?, ?, ?, ?)`,
      [jobId, req.user.id, resumePath, coverLetter || null],
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
      `SELECT a.*, j.employerId 
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.id = ?`,
      [applicationId],
    );

    if (applications.length === 0) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (applications[0].employerId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await db.query(
      "UPDATE applications SET status = ?, statusUpdatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [status, applicationId],
    );

    res.json({ message: "Application status updated successfully" });
  } catch (error) {
    console.error("Error updating application status:", error);
    res.status(500).json({ message: "Failed to update status" });
  }
};
