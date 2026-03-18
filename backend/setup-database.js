require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASS || process.env.MYSQL_PASSWORD || '2006',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'careercraft',
  port: process.env.DB_PORT || process.env.MYSQL_PORT || 3306,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    console.log('Config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Connected to database successfully!');
    
    // Create users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'employer', 'admin') NOT NULL DEFAULT 'student',
        companyName VARCHAR(255) NULL,
        college VARCHAR(255) NULL,
        course VARCHAR(255) NULL,
        graduationYear INT NULL,
        phone VARCHAR(20) NULL,
        address TEXT NULL,
        profileImage VARCHAR(500) NULL,
        emailVerified BOOLEAN DEFAULT FALSE,
        emailVerificationToken VARCHAR(255) NULL,
        resetPasswordToken VARCHAR(255) NULL,
        resetPasswordExpires DATETIME NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Users table created/verified');

    // Create jobs table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        employerId INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        skills JSON NOT NULL,
        experienceYears INT DEFAULT 0,
        experienceMonths INT DEFAULT 0,
        location VARCHAR(255) NOT NULL,
        salary VARCHAR(100) NULL,
        status ENUM('active', 'closed', 'draft') DEFAULT 'active',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employerId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_employer (employerId),
        INDEX idx_status (status),
        INDEX idx_created (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Jobs table created/verified');

    // Create applications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jobId INT NOT NULL,
        studentId INT NOT NULL,
        resumePath VARCHAR(500) NULL,
        coverLetter TEXT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        employerNotes TEXT NULL,
        appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statusUpdatedAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (jobId, studentId),
        INDEX idx_job (jobId),
        INDEX idx_student (studentId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Applications table created/verified');

    // Create email_notifications table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(500) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        status ENUM('sent', 'failed', 'pending') DEFAULT 'pending',
        sentAt TIMESTAMP NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user (userId),
        INDEX idx_status (status),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✓ Email notifications table created/verified');

    // Test the connection with a simple query
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users');
    console.log(`✓ Database test successful. Users count: ${rows[0].count}`);

    console.log('🎉 Database setup completed successfully!');

  } catch (error) {
    console.error(' Database setup failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed.');
    }
  }
}

// Run the setup
setupDatabase()
  .then(() => {
    console.log('Database setup process completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error);
    process.exit(1);
  });