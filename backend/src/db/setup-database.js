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

    // 1. Students Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        college VARCHAR(255),
        course VARCHAR(255),
        graduationYear VARCHAR(50),
        registrationDate VARCHAR(50),
        isEmailVerified BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email)
      ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Companies Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255),
        phone VARCHAR(50) UNIQUE,
        officeAddress TEXT,
        registrationDate VARCHAR(50),
        isEmailVerified BOOLEAN DEFAULT TRUE,
        INDEX idx_email (email)
      ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 3. Jobs Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        companyId INT NOT NULL,
        jobTitle VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        skillsRequired JSON NOT NULL,
        salary VARCHAR(100) NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        createdAt VARCHAR(50),
        FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE,
        INDEX idx_company (companyId)
      ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 4. Applications Table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        jobId INT NOT NULL,
        studentId INT NOT NULL,
        resumePath VARCHAR(500) NULL,
        coverLetter TEXT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        appliedDate VARCHAR(50),
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (studentId) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_application (jobId, studentId),
        INDEX idx_job (jobId),
        INDEX idx_student (studentId)
      ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log("Database tables (students, companies, jobs, applications) verified & ready!");
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