import mysql from "mysql2/promise";
import "dotenv/config.js";

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.MYSQL_HOST || "localhost",
  user: process.env.MYSQLUSER || process.env.MYSQL_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || "",
  database: process.env.MYSQL_DATABASE || "careercraft",
  port: parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || "3306"),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
};

const db = mysql.createPool(dbConfig);

export const connectDB = async () => {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Database config:", {
        host: dbConfig.host,
        user: dbConfig.user,
        database: dbConfig.database,
        port: dbConfig.port,
        ssl: dbConfig.ssl ? "enabled" : "disabled",
      });
    }

    const [rows] = await db.execute("SELECT 1 as test");
    console.log("Database connected successfully:", rows);
    return true;
  } catch (err) {
    console.error("Database connection failed:", err.message);
    process.exit(1);
  }
};

export { db, dbConfig };
