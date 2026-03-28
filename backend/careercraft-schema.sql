-- Create CareerCraft Database
CREATE DATABASE IF NOT EXISTS careercraft;
USE careercraft;

-- Users table
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
);

-- Jobs table
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
);

-- Applications table
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
);

-- Email notifications table
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
);

-- Insert sample data for testing
INSERT INTO users (firstName, lastName, username, email, password, role, companyName) VALUES
('John', 'Doe', 'johndoe', 'john@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfCSH7dSrO1o.8e', 'employer', 'Tech Corp');

INSERT INTO users (firstName, lastName, username, email, password, role, college, course, graduationYear) VALUES
('Jane', 'Smith', 'janesmith', 'jane@example.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewfCSH7dSrO1o.8e', 'student', 'Tech University', 'Computer Science', 2024);