require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const cors = require("cors");
const { Resend } = require("resend");
const path = require("path");
const fs = require("fs").promises;
const { GoogleGenAI } = require("@google/genai");
const { generateResumeDocx } = require("./resume-generator");

// Initialize Gemini Client
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const app = express();

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "careercraft",
  port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

if (process.env.NODE_ENV !== "production") {
  console.log("Database config:", {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    port: dbConfig.port,
    ssl: dbConfig.ssl ? "enabled" : "disabled",
  });
}

let db;

async function setupTables() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'employer') NOT NULL,
        companyName VARCHAR(255) NULL,
        college VARCHAR(255) NULL,
        course VARCHAR(255) NULL,
        graduationYear INT NULL,
        phone VARCHAR(20) NULL,
        address TEXT NULL,
        profileImage VARCHAR(500) NULL,
        emailVerificationToken VARCHAR(255) NULL,
        isEmailVerified BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employerId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        skills JSON NOT NULL,
        experienceYears INT DEFAULT 0,
        experienceMonths INT DEFAULT 0,
        location VARCHAR(255) NOT NULL,
        salary VARCHAR(100) NULL,
        isActive BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employerId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        jobId INT NOT NULL,
        studentId INT NOT NULL,
        resumePath VARCHAR(500) NULL,
        coverLetter TEXT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        employerNotes TEXT NULL,
        appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statusUpdatedAt TIMESTAMP NULL,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (jobId, studentId)
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS email_notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        userId INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        session_id VARCHAR(255) NULL,
        subject VARCHAR(255) NOT NULL,
        topic VARCHAR(255) NOT NULL,
        score INT DEFAULT 0,
        total_questions INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS resume_attempts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NULL,
        session_id VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log("Database tables created/verified");
  } catch (error) {
    console.error("Database setup error:", error);
  }

  // Create admin table
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS admin (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          email VARCHAR(255) NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [admins] = await db.execute("SELECT COUNT(*) as count FROM admin");
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    if (admins[0].count === 0) {
      // First boot: Create
      await db.execute(
        "INSERT INTO admin (username, password, email) VALUES (?, ?, ?)",
        [adminUsername, hashedPassword, "admin@careercraft.com"],
      );
    } else {
      // Subsequent boot: Sync with env variables if provided
      if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
        await db.execute(
          "UPDATE admin SET username = ?, password = ? ORDER BY id ASC LIMIT 1",
          [adminUsername, hashedPassword],
        );
      }
    }
  } catch (error) {
    console.error("Admin table setup error:", error);
  }
}

(async () => {
  try {
    db = await mysql.createPool(dbConfig);
    const [rows] = await db.execute("SELECT 1 as test");
    console.log("Database connected successfully:", rows);
    await setupTables();
  } catch (err) {
    console.error("Database connection failed:", err.message);
  }
})();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL,
            /https:\/\/.*\.railway\.app$/,
            /https:\/\/.*\.up\.railway\.app$/,
          ]
        : ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.static(path.join(__dirname, "../frontend")));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = "uploads/";
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images and documents are allowed!"));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Email configuration via HTTP API (Resend) to bypass SMTP port blocking
let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log("Email engine is ready via HTTP architecture");
} else {
  console.warn("Email API key not configured. Emails will gracefully fail soft.");
}

const auth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) {
    console.log("No authorization header provided");
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    console.log("No token found in authorization header");
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, user) => {
      if (err) {
        console.log("Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    },
  );
};

const optionalAuth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return next();
  const token = header.split(" ")[1];
  if (!token) return next();
  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, user) => {
      if (!err) req.user = user;
      next();
    },
  );
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

const sendEmail = async (to, subject, html, userId, type) => {
  try {
    console.log(`Attempting to send email over HTTP API to: ${to}`);
    console.log(`Subject: ${subject}`);

    if (resendClient) {
      const { data, error } = await resendClient.emails.send({
        from: '"CareerCraft Support" <support@codedeck.me>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Email successfully transmitted:", data.id);

      if (db) {
        await db.query(
          "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, to, subject, html, type, "sent"],
        );
      }
    } else {
      console.log("Email API engine missing");

      if (db) {
        await db.query(
          "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, to, subject, "Email service API not configured", type, "failed"],
        );
      }
    }
  } catch (error) {
    console.error("High level HTTP sending error:", error);

    if (db) {
      await db.query(
        "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, to, subject, error.message, type, "failed"],
      );
    }
  }
};

// ============ AUTH ROUTES ============

app.post("/api/auth/register", async (req, res) => {
  try {
    const {
      firstName,
      username,
      email,
      password,
      role,
      companyName,
      course,
      graduationYear,
      phone,
      address,
    } = req.body;

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const finalUsername =
      username ||
      email.split("@")[0] + "_" + Math.floor(Math.random() * 100000);

    const [result] = await db.query(
      `INSERT INTO users (firstName, lastName, username, email, password, role, companyName, course, graduationYear, phone, address)
       VALUES (?, '', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        finalUsername,
        email,
        hashedPassword,
        role,
        companyName || null,
        course || null,
        graduationYear || null,
        phone || null,
        address || null,
      ],
    );

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);">
          <div style="padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0; color: #000000; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CareerCraft</h2>
          </div>
          <div style="padding: 40px;">
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; font-weight: 500;">Dear ${firstName},</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining CareerCraft. Your <strong>${role}</strong> account is now active, and we are glad to have you on board.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Please log in below to access your account and explore the platform.
            </p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td align="center" bgcolor="#000000" style="border-radius: 6px;">
                  <a href="https://careercraft-gebt.onrender.com" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; border: 1px solid #000000;">
                    Log In
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
              Need help getting started? Just reply to this email, and our support team will assist you.
            </p>
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
              Best regards,<br><br>
              <strong>The CareerCraft Team</strong>
            </p>
          </div>
          <div style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
              © 2026 CareerCraft. All rights reserved.<br>
              You are receiving this email because you recently created a ${role} account.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(email, "Welcome to CareerCraft", emailHtml, result.insertId, "registration");

    res.status(201).json({ message: "Registration successful!", userId: result.insertId });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if it's an admin login
    const [adminRows] = await db.query(
      "SELECT * FROM admin WHERE username = ?",
      [email],
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];

      let valid = false;
      if (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$")) {
        valid = await bcrypt.compare(password, admin.password);
      } else {
        valid = password === admin.password;
      }

      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { username: admin.username, role: "admin" },
        process.env.JWT_SECRET || "fallback_secret_for_dev_only",
        { expiresIn: "24h" },
      );

      return res.json({
        user: { username: admin.username, firstName: "Admin", lastName: "User", role: "admin" },
        token,
      });
    }

    // Check regular users
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?",
      [email, email],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await db.query("UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "fallback_secret_for_dev_only",
      { expiresIn: "24h" },
    );

    delete user.password;
    delete user.emailVerificationToken;

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// ============ ADMIN ROUTES ============

const adminAuth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Admin access required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, decoded) => {
      if (err || decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = decoded;
      next();
    },
  );
};

app.get("/api/admin/users", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, firstName, lastName, username, email, role, companyName, college, course, graduationYear, phone, address, createdAt FROM users ORDER BY createdAt DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin users fetch error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

app.get("/api/admin/students", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, username, email, college, course, graduationYear, phone, address, createdAt 
       FROM users 
       WHERE role = 'student' 
       ORDER BY createdAt DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin students fetch error:", error);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.get("/api/admin/employers", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, username, email, companyName, phone, address, createdAt 
       FROM users 
       WHERE role = 'employer' 
       ORDER BY createdAt DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin employers fetch error:", error);
    res.status(500).json({ message: "Failed to fetch employers" });
  }
});

app.get("/api/admin/jobs", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, u.firstName as employerFirstName, u.lastName as employerLastName, u.companyName
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
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
        skills = [];
      }
      return { ...job, skills };
    });

    res.json(processedJobs);
  } catch (error) {
    console.error("Admin jobs fetch error:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

app.get("/api/admin/applications", adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, 
              s.firstName as studentFirstName, s.lastName as studentLastName,
              j.title as jobTitle,
              e.firstName as employerFirstName, e.lastName as employerLastName, e.companyName
       FROM applications a
       INNER JOIN users s ON a.studentId = s.id
       INNER JOIN jobs j ON a.jobId = j.id
       INNER JOIN users e ON j.employerId = e.id
       ORDER BY a.appliedDate DESC`,
    );
    res.json(rows);
  } catch (error) {
    console.error("Admin applications fetch error:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

app.get("/api/admin/stats", adminAuth, async (req, res) => {
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
});

// ============ JOB ROUTES ============

app.get("/api/jobs/employer", auth, requireRole(["employer"]), async (req, res) => {
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
});

app.get("/api/jobs", auth, async (req, res) => {
  try {
    const studentId = req.user.id;
    const [jobs] = await db.query(
      `SELECT j.*, 
              u.firstName as employerFirstName, 
              u.lastName as employerLastName,
              u.companyName,
              CASE WHEN a.id IS NOT NULL THEN TRUE ELSE FALSE END as hasApplied
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       LEFT JOIN applications a ON j.id = a.jobId AND a.studentId = ?
       WHERE j.isActive = TRUE
       ORDER BY j.createdAt DESC`,
      [studentId],
    );

    const processedJobs = jobs.map((job) => ({
      ...job,
      hasApplied: !!job.hasApplied,
      skills: typeof job.skills === "string" ? JSON.parse(job.skills) : job.skills,
    }));

    res.json(processedJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
});

app.post("/api/jobs", auth, requireRole(["employer"]), async (req, res) => {
  try {
    const { title, description, skills, experienceYears, location, salary } = req.body;

    if (!title || !description || !skills || !location) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: "At least one skill is required" });
    }

    const [result] = await db.query(
      `INSERT INTO jobs (employerId, title, description, skills, experienceYears, location, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, title, description, JSON.stringify(skills), experienceYears || 0, location, salary || null],
    );

    res.status(201).json({ message: "Job posted successfully", jobId: result.insertId });
  } catch (error) {
    console.error("Error posting job:", error);
    res.status(500).json({ message: "Failed to post job", error: error.message });
  }
});

app.delete("/api/jobs/:id", auth, requireRole(["employer"]), async (req, res) => {
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
});

// ============ APPLICATION ROUTES ============

app.get("/api/applications/job/:jobId", auth, requireRole(["employer"]), async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT a.*, 
              s.firstName as studentFirstName, 
              s.lastName as studentLastName,
              s.email as studentEmail,
              s.phone,
              s.college,
              s.course
       FROM applications a
       INNER JOIN users s ON a.studentId = s.id
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
});

app.get("/api/applications/student", auth, requireRole(["student"]), async (req, res) => {
  try {
    const [applications] = await db.query(
      `SELECT a.*, 
              j.title as jobTitle,
              u.firstName as employerFirstName,
              u.lastName as employerLastName,
              u.companyName
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       INNER JOIN users u ON j.employerId = u.id
       WHERE a.studentId = ?
       ORDER BY a.appliedDate DESC`,
      [req.user.id],
    );

    res.json(applications);
  } catch (error) {
    console.error("Error fetching student applications:", error);
    res.status(500).json({ message: "Failed to fetch applications" });
  }
});

app.post(
  "/api/applications",
  auth,
  requireRole(["student"]),
  upload.single("resume"),
  async (req, res) => {
    try {
      const { jobId, coverLetter } = req.body;
      const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

      if (!jobId) {
        return res.status(400).json({ message: "Job ID is required" });
      }

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
  },
);

app.patch("/api/applications/:id/status", auth, requireRole(["employer"]), async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;

    if (!["pending", "accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

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
});

// ============ STATS ROUTES ============

app.get("/api/stats/employer", auth, requireRole(["employer"]), async (req, res) => {
  try {
    const [jobStats] = await db.query(
      "SELECT COUNT(*) as totalJobs FROM jobs WHERE employerId = ?",
      [req.user.id],
    );

    const [appStats] = await db.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE j.employerId = ?`,
      [req.user.id],
    );

    res.json({
      totalJobs: jobStats[0].totalJobs || 0,
      totalApplications: appStats[0].totalApplications || 0,
      pendingApplications: appStats[0].pendingApplications || 0,
      acceptedApplications: appStats[0].acceptedApplications || 0,
      rejectedApplications: appStats[0].rejectedApplications || 0,
    });
  } catch (error) {
    console.error("Error fetching employer stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

app.get("/api/stats/student", auth, requireRole(["student"]), async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications
       WHERE studentId = ?`,
      [req.user.id],
    );

    res.json({
      totalApplications: stats[0].totalApplications || 0,
      pendingApplications: stats[0].pendingApplications || 0,
      acceptedApplications: stats[0].acceptedApplications || 0,
      rejectedApplications: stats[0].rejectedApplications || 0,
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
});

// ============ PROFILE ROUTES ============

app.get("/api/auth/profile", auth, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, firstName, username, email, role, companyName, college, course, graduationYear, phone, address, profileImage, createdAt FROM users WHERE id = ?",
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});

app.put("/api/auth/profile", auth, async (req, res) => {
  try {
    const { firstName, lastName, phone, address, companyName, college, course, graduationYear } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "employer") {
      await db.query(
        "UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ?, companyName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [firstName || null, lastName || null, phone || null, address || null, companyName || null, userId],
      );
    } else if (role === "student") {
      await db.query(
        "UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ?, college = ?, course = ?, graduationYear = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
        [firstName || null, lastName || null, phone || null, address || null, college || null, course || null, graduationYear || null, userId],
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

app.delete("/api/auth/profile", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
});

// ============ RESUME ROUTE ============

app.post("/api/resume/generate", optionalAuth, async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"] || req.ip || "guest";

    // Check rate limits
    if (req.user) {
      const timeLimit = new Date();
      timeLimit.setHours(timeLimit.getHours() - 4);
      const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM resume_attempts WHERE user_id = ? AND created_at >= ?",
        [req.user.id, timeLimit],
      );
      if (rows[0].count >= 5) {
        return res.status(403).json({ message: "You have reached the limit of 5 resumes per 4 hours. Please try again later." });
      }
    } else {
      const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM resume_attempts WHERE session_id = ?",
        [sessionId],
      );
      if (rows[0].count >= 1) {
        return res.status(403).json({ message: "Guests are limited to 1 resume. Please log in to continue." });
      }
    }

    const resumeData = req.body;

    if (
      !resumeData.personalInfo ||
      !resumeData.personalInfo.name ||
      !resumeData.personalInfo.email ||
      !resumeData.personalInfo.phone ||
      !resumeData.education ||
      resumeData.education.length === 0 ||
      !resumeData.skills ||
      resumeData.skills.length === 0
    ) {
      return res.status(400).json({ message: "Please fill in all required fields marked with *." });
    }

    const docxBuffer = await generateResumeDocx(resumeData);

    // Record attempt
    if (req.user) {
      await db.execute("INSERT INTO resume_attempts (user_id) VALUES (?)", [req.user.id]);
    } else {
      await db.execute("INSERT INTO resume_attempts (session_id) VALUES (?)", [sessionId]);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=Resume.docx");
    res.send(docxBuffer);
  } catch (error) {
    console.error("Error generating resume docx:", error);
    res.status(500).json({ message: "Failed to generate AI Resume.", error: error.message });
  }
});

// ============ CATCH-ALL & ERROR HANDLER ============

// Catch-all route for SPA (must be placed after all API routes)
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
    return res.sendFile(path.join(__dirname, "../frontend/index.html"));
  }
  next();
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`Database: ${dbConfig.host}`);
});
