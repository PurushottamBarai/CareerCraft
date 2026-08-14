import { db } from "../db/database.js";

export const getUsers = async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT id, name, email, phone, address, college, course, graduationYear, registrationDate, 'student' as role FROM students",
    );
    const [companies] = await db.query(
      "SELECT id, name, email, phone, officeAddress as address, NULL as college, NULL as course, NULL as graduationYear, registrationDate, 'employer' as role FROM companies",
    );
    res.json([...students, ...companies]);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getStudents = async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, name as firstName, email, phone, address, college, course, graduationYear, registrationDate FROM students ORDER BY id DESC",
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
      "SELECT id, name, name as firstName, name as companyName, email, phone, officeAddress, registrationDate FROM companies ORDER BY id DESC",
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
      "SELECT id, companyId, jobTitle, company, location, skillsRequired, salary, active, createdAt FROM jobs ORDER BY id DESC",
    );

    const processedJobs = rows.map((job) => ({
      ...job,
      title: job.jobTitle,
      companyName: job.company,
      skills: typeof job.skillsRequired === "string" ? JSON.parse(job.skillsRequired || "[]") : job.skillsRequired || [],
      skillsRequired: typeof job.skillsRequired === "string" ? JSON.parse(job.skillsRequired || "[]") : job.skillsRequired || [],
    }));

    res.json(processedJobs);
  } catch (error) {
    console.error("Admin jobs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

export const getApplications = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.id, a.jobId, a.studentId, a.status, a.appliedDate, a.resumePath, a.coverLetter,
              s.name as studentName, s.name as studentFirstName,
              j.jobTitle, j.jobTitle as title, j.company, j.company as companyName
       FROM applications a
       INNER JOIN students s ON a.studentId = s.id
       INNER JOIN jobs j ON a.jobId = j.id
       ORDER BY a.id DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin applications fetch error:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
};

export const getStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM students) as totalStudents,
        (SELECT COUNT(*) FROM companies) as totalEmployers,
        (SELECT COUNT(*) FROM jobs) as totalJobs,
        (SELECT COUNT(*) FROM applications) as totalApplications
    `);

    res.json(stats);
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
