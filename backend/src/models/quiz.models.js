export const createQuizModel = async (db) => {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NULL,
      session_id VARCHAR(255) NULL,
      subject VARCHAR(255) NOT NULL,
      topic VARCHAR(255) NOT NULL,
      score INT DEFAULT 0,
      total_questions INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
};
