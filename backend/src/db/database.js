import mysql from "mysql2/promise";
import "dotenv/config.js";

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  port: parseInt(process.env.MYSQL_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
};

const db = mysql.createPool(dbConfig);

export const connectDB = async () => {
  try {
    await db.execute("SELECT 1");
    console.log("DB connection ok");
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

export { db, dbConfig };
