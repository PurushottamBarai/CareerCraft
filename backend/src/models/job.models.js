export const createJobModel = async (db) => {
  await db.execute(`
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
      FOREIGN KEY (companyId) REFERENCES companies(id) ON DELETE CASCADE
    ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
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
      UNIQUE KEY unique_application (jobId, studentId)
    ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};
