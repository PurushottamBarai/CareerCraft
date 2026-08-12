import "dotenv/config.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { db, connectDB, dbConfig } from "./db/database.js";
import { runMigrations } from "./db/migrations.js";

import { createUserModel } from "./models/user.models.js";
import { createJobModel } from "./models/job.models.js";
import { createAdminModel } from "./models/admin.models.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import statRoutes from "./routes/stat.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

async function setupTables() {
  try {
    await createUserModel(db);
    await createJobModel(db);
    console.log("Database tables created/verified");
  } catch (error) {
    console.error("Database setup error:", error);
  }

  try {
    await createAdminModel(db);
  } catch (error) {
    console.error("Admin table setup error:", error);
  }
}

(async () => {
  await connectDB();
  await setupTables();
  await runMigrations();
})();

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",").map((url) => url.trim())
  : true;

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);

import fs from "fs";

const distPath = path.join(__dirname, "../../frontend/dist");
const devFrontendPath = path.join(__dirname, "../../frontend");
const staticFrontendPath = fs.existsSync(distPath) ? distPath : devFrontendPath;

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../../backend/public/uploads")));
app.use(express.static(staticFrontendPath));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/contact", contactRoutes);


app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
    const indexPath = fs.existsSync(path.join(distPath, "index.html"))
      ? path.join(distPath, "index.html")
      : path.join(devFrontendPath, "index.html");
    return res.sendFile(indexPath);
  }
  next();
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

export { app, dbConfig };
