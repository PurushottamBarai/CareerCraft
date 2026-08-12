import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";
import { dbConfig } from "./database.js";

async function setupDatabase() {
  let connection;

  try {
    console.log("Connecting to database...");
    connection = await mysql.createConnection(dbConfig);
    console.log("Connected to database successfully!");

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        firstName VARCHAR(100) NOT NULL,
        lastName VARCHAR(100) NOT NULL DEFAULT '',
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('student', 'employer', 'admin') NOT NULL DEFAULT 'student',
        phone VARCHAR(20) NULL,
        address TEXT NULL,
        isEmailVerified BOOLEAN DEFAULT FALSE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_username (username),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        college VARCHAR(255) NULL,
        course VARCHAR(255) NULL,
        graduationYear INT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS employer_profiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL UNIQUE,
        companyName VARCHAR(255) NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

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

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jobId INT NOT NULL,
        studentId INT NOT NULL,
        resumePath VARCHAR(500) NULL,
        coverLetter TEXT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        appliedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        statusUpdatedAt TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (jobId, studentId),
        INDEX idx_job (jobId),
        INDEX idx_student (studentId),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);


    console.log("Database tables verified & ready!");
  } catch (error) {
    console.error("Database setup failed:", error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

setupDatabase();