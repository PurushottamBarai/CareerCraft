import bcrypt from "bcryptjs";

export const createAdminModel = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS admin (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(255) NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [admins] = await db.execute("SELECT COUNT(*) as count FROM admin");
  if (admins[0].count === 0 && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    await db.execute(
      "INSERT INTO admin (username, password, email) VALUES (?, ?, ?)",
      [process.env.ADMIN_USERNAME, hashedPassword, process.env.EMAIL_FROM || null]
    );
  }
};
