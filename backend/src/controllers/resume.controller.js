import { db } from "../db/database.js";

const getResumeServiceUrl = () => {
  return (process.env.RESUME_SERVICE_URL || "https://resumecraft-9zk4.onrender.com").replace(/\/$/, "");
};

export const generateResume = async (req, res) => {
  try {
    const sessionId = req.headers["x-session-id"] || req.ip || "guest";

    // Check rate limits
    if (req.user) {
      const timeLimit = new Date();
      timeLimit.setHours(timeLimit.getHours() - 4);
      const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM resume_attempts WHERE user_id = ? AND created_at >= ?",
        [req.user.id, timeLimit],
      );
      if (rows[0].count >= 5) {
        return res.status(403).json({ message: "You have reached the limit of 5 resumes per 4 hours. Please try again later." });
      }
    } else {
      const guestTimeLimit = new Date();
      guestTimeLimit.setHours(guestTimeLimit.getHours() - 8);
      const [rows] = await db.query(
        "SELECT COUNT(*) as count FROM resume_attempts WHERE session_id = ? AND created_at >= ?",
        [sessionId, guestTimeLimit],
      );
      if (rows[0].count >= 1) {
        return res.status(403).json({ message: "Guests are limited to 1 resume. Please log in to continue." });
      }
    }

    const resumeData = req.body;
    const serviceUrl = getResumeServiceUrl();

    // Call standalone ResumeCraft API
    const apiResponse = await fetch(`${serviceUrl}/api/resume/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resumeData),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text().catch(() => "");
      throw new Error(`ResumeCraft API error (${apiResponse.status}): ${errText}`);
    }

    const arrayBuffer = await apiResponse.arrayBuffer();
    const docxBuffer = Buffer.from(arrayBuffer);

    // Record attempt in database
    if (req.user) {
      await db.execute("INSERT INTO resume_attempts (user_id) VALUES (?)", [req.user.id]);
    } else {
      await db.execute("INSERT INTO resume_attempts (session_id) VALUES (?)", [sessionId]);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", "attachment; filename=Resume.docx");
    res.send(docxBuffer);
  } catch (error) {
    console.error("Error generating resume via API:", error);
    res.status(500).json({ message: "Failed to generate AI Resume via ResumeCraft API.", error: error.message });
  }
};

export const enhanceResumeText = async (req, res) => {
  try {
    const { text, fieldType } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Text content is required for enhancement." });
    }

    const serviceUrl = getResumeServiceUrl();

    // Call standalone ResumeCraft API
    const apiResponse = await fetch(`${serviceUrl}/api/resume/enhance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text, fieldType }),
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text().catch(() => "");
      throw new Error(`ResumeCraft API error (${apiResponse.status}): ${errText}`);
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error enhancing resume text via API:", error);
    res.status(500).json({ message: "Failed to enhance text via ResumeCraft API.", error: error.message });
  }
};
