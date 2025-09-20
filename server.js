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

// Database configuration with Railway environment variables
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


// Add this function after your database connection in server.js
async function setupTables() {
  try {
    // Create users table
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

    // Create jobs table
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

    // Create applications table
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

    // Create email_notifications table
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

// CORS configuration for Railway
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
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
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
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    
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

app.get('/api/auth/profile', auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, firstName, lastName, username, email, role, companyName, college, course, graduationYear, phone, address, profileImage, createdAt FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

app.post('/api/jobs', auth, requireRole(['employer']), async (req, res) => {
  try {
    console.log('Job posting request received:', req.body);
    
    const { title, description, skills, experienceYears, experienceMonths, location, salary } = req.body;
    const employerId = req.user.id;
    
    if (!title || !description || !location) {
      return res.status(400).json({ message: 'Title, description, and location are required' });
    }
    
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ message: 'At least one skill is required' });
    }

    const [result] = await db.query(
      `INSERT INTO jobs (employerId, title, description, skills, experienceYears, experienceMonths, location, salary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [employerId, title, description, JSON.stringify(skills), experienceYears || 0, experienceMonths || 0, location, salary || null]
    );

    console.log('Job posted successfully with ID:', result.insertId);
    res.json({ message: "Job posted successfully", jobId: result.insertId });
  } catch (error) {
    console.error('Job posting database error:', error);
    res.status(500).json({ message: "Failed to post job", error: error.message });
  }
});

app.get('/api/jobs', auth, async (req, res) => {
  try {
    console.log('Fetching jobs for user:', req.user.id, 'role:', req.user.role);
    
    const query = `
      SELECT 
        j.id, j.employerId, j.title, j.description, j.skills, 
        j.experienceYears, j.experienceMonths, j.location, j.salary, j.createdAt,
        u.companyName, u.firstName as employerFirstName, u.lastName as employerLastName
      FROM jobs j 
      INNER JOIN users u ON j.employerId = u.id 
      ORDER BY j.createdAt DESC
    `;
    
    const [rows] = await db.query(query);
    console.log('Raw database results:', rows.length, 'jobs found');
    
    const processedJobs = rows.map(job => {
      let skills = [];
      try {
        if (typeof job.skills === 'string') {
          skills = JSON.parse(job.skills);
        } else if (Array.isArray(job.skills)) {
          skills = job.skills;
        }
      } catch (e) {
        console.error('Skills parsing error for job', job.id, ':', e);
        skills = [];
      }
      
      return {
        ...job,
        skills: skills
      };
    });
    
    console.log('Processed jobs:', processedJobs.length);
    res.json(processedJobs);
    
  } catch (error) {
    console.error('Complete error details:', error);
    res.status(500).json({ 
      message: 'Database query failed', 
      error: error.message,
      code: error.code 
    });
  }
});

app.get('/api/jobs/employer', auth, requireRole(['employer']), async (req, res) => {
  try {
    console.log('Fetching employer jobs for user:', req.user.id);
    
    const [jobs] = await db.query(`
      SELECT j.id, j.title, j.description, j.skills, j.experienceYears, j.experienceMonths, 
             j.location, j.salary, j.createdAt
      FROM jobs j 
      WHERE j.employerId = ?
      ORDER BY j.createdAt DESC
    `, [req.user.id]);
    
    console.log('Found', jobs.length, 'jobs for employer');
    
    const processedJobs = [];
    for (let job of jobs) {
      try {
        const [appCounts] = await db.query(`
          SELECT 
            COUNT(*) as applicationCount,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingApplications,
            COUNT(CASE WHEN status = 'accepted' THEN 1 END) as acceptedApplications,
            COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedApplications
          FROM applications 
          WHERE jobId = ?
        `, [job.id]);
        
        let skills = [];
        try {
          if (typeof job.skills === 'string') {
            skills = JSON.parse(job.skills);
          } else if (Array.isArray(job.skills)) {
            skills = job.skills;
          }
        } catch (e) {
          console.error('Skills parsing error for job', job.id);
          skills = [];
        }
        
        processedJobs.push({
          ...job,
          skills: skills,
          applicationCount: parseInt(appCounts[0].applicationCount) || 0,
          pendingApplications: parseInt(appCounts[0].pendingApplications) || 0,
          acceptedApplications: parseInt(appCounts[0].acceptedApplications) || 0,
          rejectedApplications: parseInt(appCounts[0].rejectedApplications) || 0
        });
      } catch (err) {
        console.error('Error processing job', job.id, ':', err);
        processedJobs.push({
          ...job,
          skills: [],
          applicationCount: 0,
          pendingApplications: 0,
          acceptedApplications: 0,
          rejectedApplications: 0
        });
      }
    }
    
    console.log('Employer jobs processed:', processedJobs.length);
    res.json(processedJobs);
    
  } catch (error) {
    console.error('Employer jobs error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch employer jobs', 
      error: error.message 
    });
  }
});

app.post('/api/applications', auth, requireRole(['student']), upload.single('resume'), async (req, res) => {
  try {
    const { jobId, coverLetter } = req.body;
    const studentId = req.user.id;
    const resumePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [existingApp] = await db.query(
      'SELECT id FROM applications WHERE jobId = ? AND studentId = ?',
      [jobId, studentId]
    );
    
    if (existingApp.length > 0) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    await db.query(
      `INSERT INTO applications (jobId, studentId, resumePath, coverLetter)
       VALUES (?, ?, ?, ?)`,
      [jobId, studentId, resumePath, coverLetter]
    );

    res.json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({ message: "Failed to submit application", error: error.message });
  }
});

app.get('/api/applications/student', auth, requireRole(['student']), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT a.*, j.title AS jobTitle, u.companyName, u.firstName as employerFirstName, u.lastName as employerLastName
       FROM applications a
       JOIN jobs j ON a.jobId = j.id
       JOIN users u ON j.employerId = u.id
       WHERE a.studentId = ?
       ORDER BY a.appliedDate DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Student applications fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

app.get('/api/applications/job/:jobId', auth, requireRole(['employer']), async (req, res) => {
  try {
    const [jobCheck] = await db.query('SELECT id FROM jobs WHERE id = ? AND employerId = ?', [req.params.jobId, req.user.id]);
    if (jobCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const [rows] = await db.query(
      `SELECT a.*, u.firstName AS studentFirstName, u.lastName AS studentLastName, u.email AS studentEmail,
              u.college, u.course, u.graduationYear, u.phone
       FROM applications a
       JOIN users u ON a.studentId = u.id
       WHERE a.jobId = ?
       ORDER BY a.appliedDate DESC`,
      [req.params.jobId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Job applications fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch applications' });
  }
});

app.patch('/api/applications/:id/status', auth, requireRole(['employer']), async (req, res) => {
  try {
    const { status, employerNotes } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const [appCheck] = await db.query(`
      SELECT a.*, j.title, u.firstName as studentFirstName, u.lastName as studentLastName, u.email as studentEmail
      FROM applications a 
      JOIN jobs j ON a.jobId = j.id 
      JOIN users u ON a.studentId = u.id
      WHERE a.id = ? AND j.employerId = ?
    `, [req.params.id, req.user.id]);
    
    if (appCheck.length === 0) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await db.query(
      "UPDATE applications SET status = ?, employerNotes = ?, statusUpdatedAt = CURRENT_TIMESTAMP WHERE id = ?", 
      [status, employerNotes || null, req.params.id]
    );

    res.json({ message: `Application ${status} successfully` });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ message: 'Failed to update status' });
  }
});

app.get('/api/stats/employer', auth, requireRole(['employer']), async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT j.id) as totalJobs,
        COUNT(DISTINCT a.id) as totalApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pendingApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as acceptedApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejectedApplications
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.jobId
      WHERE j.employerId = ?
    `, [req.user.id]);
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Employer stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch employer stats' });
  }
});

app.get('/api/stats/student', auth, requireRole(['student']), async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT a.id) as totalApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'pending' THEN a.id END) as pendingApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'accepted' THEN a.id END) as acceptedApplications,
        COUNT(DISTINCT CASE WHEN a.status = 'rejected' THEN a.id END) as rejectedApplications
      FROM applications a
      WHERE a.studentId = ?
    `, [req.user.id]);

    res.json(stats[0]);
  } catch (error) {
    console.error('Student stats fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch student stats' });
  }
});

// Health check routes
app.get('/api/test-db', async (req, res) => {
  try {
    const [result] = await db.query('SELECT 1 as test');
    res.json({ message: 'Database connected', result });
  } catch (error) {
    res.status(500).json({ message: 'Database error', error: error.message });
  }
});

app.get('/api/test', async (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
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