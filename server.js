require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs').promises;

const app = express();

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || '2006',
  database: process.env.MYSQL_DATABASE || 'careercraft',
  port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};
console.log('DB Environment Check:');
console.log('MYSQLHOST:', process.env.MYSQLHOST);
console.log('MYSQLUSER:', process.env.MYSQLUSER);
console.log('Final host:', dbConfig.host);

console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: dbConfig.ssl ? 'enabled' : 'disabled'
});

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

    console.log('Database tables created/verified');
  } catch (error) {
    console.error('Database setup error:', error);
  }
}


(async () => {
  try {
    db = await mysql.createPool(dbConfig);
    const [rows] = await db.execute('SELECT 1 as test');
    console.log('Database connected successfully:', rows);
    
    await setupTables();
    
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
})();

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        /https:\/\/.*\.railway\.app$/,
        /https:\/\/.*\.up\.railway\.app$/
      ]
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname));

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = 'uploads/';
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and documents are allowed!'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

// Email configuration
let transporter = null;
console.log('Checking email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not set');

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    transporter.verify((error, success) => {
      if (error) {
        console.error('Email configuration error:', error);
      } else {
        console.log('Email server is ready to send messages');
      }
    });
  } catch (error) {
    console.error('Error creating email transporter:', error);
  }
} else {
  console.warn('Email credentials not configured. Emails will not be sent.');
}

const auth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) {
    console.log('No authorization header provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = header.split(' ')[1];
  if (!token) {
    console.log('No token found in authorization header');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || '#Purushottam2006', (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

const sendEmail = async (to, subject, html, userId, type) => {
  try {
    console.log(`Attempting to send email to: ${to}`);
    console.log(`Subject: ${subject}`);
    
    if (transporter) {
      const mailOptions = {
        from: `"CareerCraft" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      if (db) {
        await db.query(
          'INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, to, subject, html, type, 'sent']
        );
      }
    } else {
      console.log('Email transporter not available');
      
      if (db) {
        await db.query(
          'INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)',
          [userId, to, subject, 'Email service not configured', type, 'failed']
        );
      }
    }
  } catch (error) {
    console.error('Email sending error:', error);
    
    if (db) {
      await db.query(
        'INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, to, subject, error.message, type, 'failed']
      );
    }
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, role, companyName, college, course, graduationYear, phone, address } = req.body;
    
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const [result] = await db.query(
      `INSERT INTO users (firstName, lastName, username, email, password, role, companyName, college, course, graduationYear, phone, address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, username, email, hashedPassword, role, companyName || null, college || null, course || null, graduationYear || null, phone || null, address || null]
    );

    const emailHtml = `
      <h1>Welcome to CareerCraft!</h1>
      <p>Dear ${firstName},</p>
      <p>Thank you for registering as a ${role}. Your account has been created successfully.</p>
      <p>You can now log in and start using our platform.</p>
      <br><p>Best regards,<br>The CareerCraft Team</p>
    `;
    
    await sendEmail(email, 'Welcome to CareerCraft', emailHtml, result.insertId, 'registration');
    
    res.status(201).json({ 
      message: 'Registration successful! Please check your email for confirmation.',
      userId: result.insertId 
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // First check if it's an admin login
    const [adminRows] = await db.query(
      "SELECT * FROM admin WHERE username = ?", 
      [email]
    );
    
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      
      // Check password (plain text or hashed)
      let valid = false;
      if (admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$')) {
        valid = await bcrypt.compare(password, admin.password);
      } else {
        valid = password === admin.password;
      }
      
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { username: admin.username, role: 'admin' }, 
        process.env.JWT_SECRET || '#Purushottam2006',
        { expiresIn: '24h' }
      );
      
      return res.json({ 
        user: { 
          username: admin.username, 
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin' 
        }, 
        token 
      });
    }
    
    // If not admin, check regular users (student/employer)
    const [rows] = await db.query(
      "SELECT * FROM users WHERE email = ? OR username = ?", 
      [email, email]
    );
    
    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await db.query('UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email }, 
      process.env.JWT_SECRET || '#Purushottam2006',
      { expiresIn: '24h' }
    );

    delete user.password;
    delete user.emailVerificationToken;

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

// ============ ADMIN ROUTES ============

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  const header = req.headers['authorization'];
  if (!header) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  const token = header.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET || '#Purushottam2006', (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  });
};

// Get all users
app.get('/api/admin/users', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, firstName, lastName, username, email, role, companyName, college, course, graduationYear, phone, address, createdAt FROM users ORDER BY createdAt DESC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Admin users fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Get all students
app.get('/api/admin/students', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, username, email, college, course, graduationYear, phone, address, createdAt 
       FROM users 
       WHERE role = 'student' 
       ORDER BY createdAt DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Admin students fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get all employers
app.get('/api/admin/employers', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, firstName, lastName, username, email, companyName, phone, address, createdAt 
       FROM users 
       WHERE role = 'employer' 
       ORDER BY createdAt DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Admin employers fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch employers' });
  }
});

// Get all jobs
app.get('/api/admin/jobs', adminAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT j.*, u.firstName as employerFirstName, u.lastName as employerLastName, u.companyName
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       ORDER BY j.createdAt DESC`
    );
    
    const processedJobs = rows.map(job => {
      let skills = [];
      try {
        if (typeof job.skills === 'string') {
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
    console.error('Admin jobs fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get all applications
app.get('/api/admin/applications', adminAuth, async (req, res) => {
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
       ORDER BY a.appliedDate DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error('Admin applications fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get admin statistics
app.get('/api/admin/stats', adminAuth, async (req, res) => {
  try {
    const [studentCount] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'student'"
    );
    const [employerCount] = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE role = 'employer'"
    );
    const [jobCount] = await db.query('SELECT COUNT(*) as count FROM jobs');
    const [applicationCount] = await db.query('SELECT COUNT(*) as count FROM applications');
    
    res.json({
      totalStudents: studentCount[0].count,
      totalEmployers: employerCount[0].count,
      totalJobs: jobCount[0].count,
      totalApplications: applicationCount[0].count
    });
  } catch (error) {
    console.error('Admin stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});
// Add these routes to your server.js file, after the existing job routes

// Get jobs posted by the logged-in employer
app.get('/api/jobs/employer', auth, requireRole(['employer']), async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, 
              COUNT(DISTINCT a.id) as applicationCount
       FROM jobs j
       LEFT JOIN applications a ON j.id = a.jobId
       WHERE j.employerId = ?
       GROUP BY j.id
       ORDER BY j.createdAt DESC`,
      [req.user.id]
    );
    
    // Parse skills JSON for each job
    const processedJobs = jobs.map(job => ({
      ...job,
      skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills
    }));
    
    res.json(processedJobs);
  } catch (error) {
    console.error('Error fetching employer jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get all jobs (for students)
app.get('/api/jobs', auth, async (req, res) => {
  try {
    const [jobs] = await db.query(
      `SELECT j.*, 
              u.firstName as employerFirstName, 
              u.lastName as employerLastName,
              u.companyName
       FROM jobs j
       INNER JOIN users u ON j.employerId = u.id
       WHERE j.isActive = TRUE
       ORDER BY j.createdAt DESC`
    );
    
    // Parse skills JSON for each job
    const processedJobs = jobs.map(job => ({
      ...job,
      skills: typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills
    }));
    
    res.json(processedJobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Failed to fetch jobs' });
  }
});

// Get applications for a specific job (for employers)
app.get('/api/applications/job/:jobId', auth, requireRole(['employer']), async (req, res) => {
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
      [req.params.jobId, req.user.id]
    );
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get student's applications
app.get('/api/applications/student', auth, requireRole(['student']), async (req, res) => {
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
      [req.user.id]
    );
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching student applications:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

// Get employer statistics
app.get('/api/stats/employer', auth, requireRole(['employer']), async (req, res) => {
  try {
    const [jobStats] = await db.query(
      'SELECT COUNT(*) as totalJobs FROM jobs WHERE employerId = ?',
      [req.user.id]
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
      [req.user.id]
    );
    
    res.json({
      totalJobs: jobStats[0].totalJobs || 0,
      totalApplications: appStats[0].totalApplications || 0,
      pendingApplications: appStats[0].pendingApplications || 0,
      acceptedApplications: appStats[0].acceptedApplications || 0,
      rejectedApplications: appStats[0].rejectedApplications || 0
    });
  } catch (error) {
    console.error('Error fetching employer stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get student statistics
app.get('/api/stats/student', auth, requireRole(['student']), async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications
       WHERE studentId = ?`,
      [req.user.id]
    );
    
    res.json({
      totalApplications: stats[0].totalApplications || 0,
      pendingApplications: stats[0].pendingApplications || 0,
      acceptedApplications: stats[0].acceptedApplications || 0,
      rejectedApplications: stats[0].rejectedApplications || 0
    });
  } catch (error) {
    console.error('Error fetching student stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Get user profile
app.get('/api/auth/profile', auth, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, firstName, lastName, username, email, role, companyName, college, course, graduationYear, phone, address, profileImage, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(users[0]);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Post a new job (for employers)
app.post('/api/jobs', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { title, description, skills, experienceYears, experienceMonths, location, salary } = req.body;
    
    // Validation
    if (!title || !description || !skills || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: 'At least one skill is required' });
    }
    
    const [result] = await db.query(
      `INSERT INTO jobs (employerId, title, description, skills, experienceYears, experienceMonths, location, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        title,
        description,
        JSON.stringify(skills),
        experienceYears || 0,
        experienceMonths || 0,
        location,
        salary || null
      ]
    );
    
    res.status(201).json({
      message: 'Job posted successfully',
      jobId: result.insertId
    });
  } catch (error) {
    console.error('Error posting job:', error);
    res.status(500).json({ message: 'Failed to post job', error: error.message });
  }
});

// Update application status
app.patch('/api/applications/:id/status', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { status } = req.body;
    const applicationId = req.params.id;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Verify the employer owns the job this application belongs to
    const [applications] = await db.query(
      `SELECT a.*, j.employerId 
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE a.id = ?`,
      [applicationId]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    if (applications[0].employerId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    await db.query(
      'UPDATE applications SET status = ?, statusUpdatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [status, applicationId]
    );
    
    res.json({ message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

// Submit job application
app.post('/api/applications', auth, requireRole(['student']), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!jobId) {
      return res.status(400).json({ message: 'Job ID is required' });
    }
    
    // Check if already applied
    const [existing] = await db.query(
      'SELECT id FROM applications WHERE jobId = ? AND studentId = ?',
      [jobId, req.user.id]
    );
    
    if (existing.length > 0) {
      return res.status(400).json({ message: 'You have already applied to this job' });
    }
    
    const [result] = await db.query(
      `INSERT INTO applications (jobId, studentId, resumePath, coverLetter)
       VALUES (?, ?, ?, ?)`,
      [jobId, req.user.id, resumePath, coverLetter || null]
    );
    
    res.status(201).json({
      message: 'Application submitted successfully',
      applicationId: result.insertId
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ message: 'Failed to submit application', error: error.message });
  }
});

// Catch-all route for SPA
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${dbConfig.host}`);
});