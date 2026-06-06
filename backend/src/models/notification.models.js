export const createNotificationModel = async (db) => {
  await db.execute(`
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
    )
  `);
};
