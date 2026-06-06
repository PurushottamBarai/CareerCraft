import "dotenv/config.js";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import { db, connectDB, dbConfig } from "./db/database.js";

import { createUserModel } from "./models/user.models.js";
import { createJobModel } from "./models/job.models.js";
import { createNotificationModel } from "./models/notification.models.js";
import { createQuizModel } from "./models/quiz.models.js";
import { createResumeModel } from "./models/resume.models.js";
import { createAdminModel } from "./models/admin.models.js";

import authRoutes from "./routes/auth.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import statRoutes from "./routes/stat.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import contactRoutes from "./routes/contact.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set("trust proxy", 1);

async function setupTables() {
  try {
    await createUserModel(db);
    await createJobModel(db);
    await createNotificationModel(db);
    await createQuizModel(db);
    await createResumeModel(db);
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
})();

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? [
            process.env.FRONTEND_URL,
            /https:\/\/.*\.railway\.app$/,
            /https:\/\/.*\.up\.railway\.app$/,
          ]
        : ["http://localhost:3000", "http://localhost:5000"],
    credentials: true,
  }),
);

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../../backend/public/uploads")));
app.use(express.static(path.join(__dirname, "../../frontend")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/stats", statRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/contact", contactRoutes);

// ============ CATCH-ALL & ERROR HANDLER ============
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api/") && !req.path.startsWith("/uploads/")) {
    return res.sendFile(path.join(__dirname, "../../frontend/index.html"));
  }
  next();
});

app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({ message: "Internal server error", error: err.message });
});

export { app, dbConfig };
