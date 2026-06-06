import { db } from "../db/database.js";

export const getUsers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.email, u.role, u.phone, u.address, u.createdAt,
              e.companyName, s.college, s.course, s.graduationYear
       FROM users u
       LEFT JOIN student_profiles s ON u.id = s.userId
       LEFT JOIN employer_profiles e ON u.id = e.userId
       ORDER BY u.createdAt DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.email, s.college, s.course, s.graduationYear, u.phone, u.address, u.createdAt 
       FROM users u 
       INNER JOIN student_profiles s ON u.id = s.userId
       WHERE u.role = 'student' 
       ORDER BY u.createdAt DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin students fetch error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
};

export const getEmployers = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.email, e.companyName, u.phone, u.address, u.createdAt 
       FROM users u 
       INNER JOIN employer_profiles e ON u.id = e.userId
       WHERE u.role = 'employer' 
       ORDER BY u.createdAt DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin employers fetch error:", error);
    res.status(500).json({ message: "Failed to fetch employers" });
  }
};

export const getJobs = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, u.firstName as employerFirstName, u.lastName as employerLastName, e.companyName
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       INNER JOIN employer_profiles e ON u.id = e.userId
       ORDER BY j.createdAt DESC`,
    );

    const processedJobs = rows.map((job) => {
      let skills = [];
      try {
        if (typeof job.skills === "string") {
          skills = JSON.parse(job.skills);
        } else if (Array.isArray(job.skills)) {
          skills = job.skills;
        }
      } catch (e) {
        console.error(`Error parsing skills for job ${job.id}:`, e);
        skills = [];
      }
      return { ...job, skills };
    });

    res.json(processedJobs);
  } catch (error) {
    console.error("Admin jobs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, 
              s.firstName as studentFirstName, s.lastName as studentLastName,
              j.title as jobTitle,
              e.firstName as employerFirstName, e.lastName as employerLastName, emp.companyName
       FROM applications a
       INNER JOIN users s ON a.studentId = s.id
       INNER JOIN jobs j ON a.jobId = j.id
       INNER JOIN users e ON j.employerId = e.id
       INNER JOIN employer_profiles emp ON e.id = emp.userId
       ORDER BY a.appliedDate DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin applications fetch error:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const getStats = async (req, res) => {
  try {
    const [studentCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'student'");
    const [employerCount] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'employer'");
    const [jobCount] = await db.query("SELECT COUNT(*) as count FROM jobs");
    const [applicationCount] = await db.query("SELECT COUNT(*) as count FROM applications");

    res.json({
      totalStudents: studentCount[0].count,
      totalEmployers: employerCount[0].count,
      totalJobs: jobCount[0].count,
      totalApplications: applicationCount[0].count,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
