import { db } from "./database.js";

export const runMigrations = async () => {
  try {
    await db.query("ALTER TABLE users ADD COLUMN isEmailVerified BOOLEAN DEFAULT FALSE").catch(() => {});
    console.log("Migrations complete");
  } catch (err) {
    console.error("Migration error:", err.message);
  }
};
