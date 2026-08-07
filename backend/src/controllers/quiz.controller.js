import { db } from "../db/database.js";

const getQuizServiceUrl = () => {
  return (process.env.QUIZ_SERVICE_URL || "https://quiz-d8f3.onrender.com").replace(/\/$/, "");
};

export const getAccessStatus = async (req, res) => {
  try {
    const serviceUrl = getQuizServiceUrl();
    const sessionId = req.headers["x-session-id"] || req.ip || "guest";
    const userId = req.user ? req.user.id : null;

    const apiResponse = await fetch(`${serviceUrl}/api/quiz/status`, {
      method: "GET",
      headers: {
        "x-session-id": sessionId,
        ...(userId ? { "x-user-id": String(userId) } : {})
      }
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text().catch(() => "");
      throw new Error(`Quiz service responded with status ${apiResponse.status}: ${errText}`);
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error proxying quiz status:", error);
    res.status(500).json({ allowed: false, reason: "Failed to connect to Quiz service: " + error.message });
  }
};

export const generateQuiz = async (req, res) => {
  try {
    const { subject, topic, sessionId } = req.body;
    const serviceUrl = getQuizServiceUrl();
    const userId = req.user ? req.user.id : null;

    const apiResponse = await fetch(`${serviceUrl}/api/quiz/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subject,
        topic,
        sessionId: sessionId || req.ip,
        userId
      })
    });

    if (!apiResponse.ok) {
      const errData = await apiResponse.json().catch(() => ({}));
      return res.status(apiResponse.status).json(errData.error ? errData : { error: `Quiz service error ${apiResponse.status}` });
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error proxying generate quiz:", error);
    res.status(500).json({ error: "Failed to generate quiz via standalone Quiz service: " + error.message });
  }
};

export const recordQuizResult = async (req, res) => {
  try {
    const { subject, topic, score, totalQuestions, sessionId } = req.body;
    const serviceUrl = getQuizServiceUrl();
    const userId = req.user ? req.user.id : null;

    // Record in local CareerCraft database if available
    if (req.user) {
      await db.execute(
        "INSERT INTO quiz_attempts (user_id, subject, topic, score, total_questions) VALUES (?, ?, ?, ?, ?)",
        [req.user.id, subject, topic, score, totalQuestions]
      ).catch(e => console.warn("CareerCraft DB record notice:", e.message));
    } else if (sessionId) {
      await db.execute(
        "INSERT INTO quiz_attempts (session_id, subject, topic, score, total_questions) VALUES (?, ?, ?, ?, ?)",
        [sessionId, subject, topic, score, totalQuestions]
      ).catch(e => console.warn("CareerCraft DB record notice:", e.message));
    }

    // Proxy submit to Quiz service
    const apiResponse = await fetch(`${serviceUrl}/api/quiz/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject,
        topic,
        score,
        totalQuestions,
        sessionId: sessionId || req.ip,
        userId
      })
    });

    if (!apiResponse.ok) {
      const errData = await apiResponse.json().catch(() => ({}));
      return res.status(apiResponse.status).json(errData);
    }

    const data = await apiResponse.json();
    res.json(data);
  } catch (error) {
    console.error("Error proxying quiz submit:", error);
    res.status(500).json({ error: "Failed to record quiz results via standalone Quiz service." });
  }
};
