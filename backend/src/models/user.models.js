export const createUserModel = async (db) => {
  await db.execute(`
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
      isEmailVerified BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255),
      phone VARCHAR(50) UNIQUE,
      officeAddress TEXT,
      registrationDate VARCHAR(50),
      isEmailVerified BOOLEAN DEFAULT TRUE
    ) ENGINE=InnoDB AUTO_INCREMENT=1000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
};
