export const createUserModel = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      firstName VARCHAR(100) NOT NULL,
      lastName VARCHAR(100) NOT NULL,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student', 'employer') NOT NULL,
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
    CREATE TABLE IF NOT EXISTS student_profiles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL UNIQUE,
      college VARCHAR(255) NOT NULL,
      course VARCHAR(255) NOT NULL,
      graduationYear INT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS employer_profiles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      userId INT NOT NULL UNIQUE,
      companyName VARCHAR(255) NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};
