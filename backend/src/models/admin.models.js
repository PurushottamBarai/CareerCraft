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
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  if (admins[0].count === 0) {
    // First boot: Create
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await db.execute(
      "INSERT INTO admin (username, password, email) VALUES (?, ?, ?)",
      [adminUsername, hashedPassword, "admin@careercraft.com"],
    );
  } else {
    // Subsequent boot: Sync with env variables if provided and changed
    if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
      const [currentAdmin] = await db.execute("SELECT username, password FROM admin ORDER BY id ASC LIMIT 1");
      if (currentAdmin.length > 0) {
        const isMatch = await bcrypt.compare(adminPassword, currentAdmin[0].password);
        if (!isMatch || currentAdmin[0].username !== adminUsername) {
          const newHashedPassword = await bcrypt.hash(adminPassword, 12);
          await db.execute(
            "UPDATE admin SET username = ?, password = ? ORDER BY id ASC LIMIT 1",
            [adminUsername, newHashedPassword],
          );
        }
      }
    }
  }
};
