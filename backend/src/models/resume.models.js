export const createResumeModel = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS resume_attempts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      session_id VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};
