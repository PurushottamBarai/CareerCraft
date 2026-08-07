import { db } from '../db/database.js';

export const runMigrations = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(5) NOT NULL,
        expiresAt DATETIME NOT NULL,
        payload TEXT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    await db.query(`
      ALTER TABLE otp_verifications ADD COLUMN payload TEXT NULL
    `).catch(() => {});
    console.log('Migrations complete');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
};
