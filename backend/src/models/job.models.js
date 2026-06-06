export const createJobModel = async (db) => {
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
};
