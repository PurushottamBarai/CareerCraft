import { GoogleGenAI } from "@google/genai";
import { db } from "../db/database.js";

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const checkLimits = async (user, sessionId) => {
    console.log("Checking limits for:", { user: !!user, sessionId });
    // Logged in user: Limit 5 attempts per 4 hours
    if (user) {
        const timeLimit = new Date();
        timeLimit.setHours(timeLimit.getHours() - 4);
        
        const [rows] = await db.query(
            "SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = ? AND created_at >= ?", 
            [user.id, timeLimit]
        );
        
        return {
            allowed: rows[0].count < 5,
            reason: rows[0].count >= 5 ? "You have reached the limit of 5 quizzes per 4 hours. Please try again later." : null,
            remaining: 5 - rows[0].count
        };
    } 
    // Guest user: Limit 1 attempt total based on session/UI enforcing
    else {
        if (!sessionId) {
            return { allowed: true, remaining: 1, isGuest: true };
        }
        // Guest user limit reset after 8 hours
        const guestTimeLimit = new Date();
        guestTimeLimit.setHours(guestTimeLimit.getHours() - 8);
        const [rows] = await db.query(
            "SELECT COUNT(*) as count FROM quiz_attempts WHERE session_id = ? AND created_at >= ?", 
            [sessionId, guestTimeLimit]
        );
        return {
            allowed: rows[0].count < 1,
            reason: rows[0].count >= 1 ? "Guests are limited to 1 quiz. Please log in to continue." : null,
            remaining: 1 - rows[0].count,
            isGuest: true
        };
    }
};

export const getAccessStatus = async (req, res) => {
    try {
        const sessionId = req.headers['x-session-id'] || null;
        const limitCalc = await checkLimits(req.user, sessionId);
        res.json(limitCalc);
    } catch (error) {
        console.error("Error fetching access status:", error);
        res.status(500).json({ allowed: false, reason: "Server error: " + error.message });
    }
};

export const generateQuiz = async (req, res) => {
    try {
        const { subject, topic, sessionId } = req.body;
        


        const limitCalc = await checkLimits(req.user, sessionId);
        if (!limitCalc.allowed) {
            return res.status(403).json({ error: limitCalc.reason });
        }

        const prompt = `
Generate a 10-question multiple-choice quiz about ${topic} in ${subject}.
Return the result STRICTLY as a JSON array of objects, with no markdown code block wrappers (do not write \`\`\`json).
Each object MUST have:
- "question": string
- "options": array of 4 strings
- "correctAnswerIndex": integer (0 to 3) representing the index of the correct option
- "explanation": string explaining why the answer is correct
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let textContent = response.text;
        
        if (textContent.startsWith("\`\`\`json")) {
            textContent = textContent.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();
        } else if (textContent.startsWith("\`\`\`")) {
            textContent = textContent.replace(/\`\`\`/g, "").trim();
        }

        const jsonPayload = JSON.parse(textContent);
        
        res.json({ questions: jsonPayload });
    } catch (error) {
        console.error("Gemini generation error:", error);
        res.status(500).json({ error: "Failed to generate quiz. Check API key and quotas." });
    }
};

export const recordQuizResult = async (req, res) => {
    try {
        const { subject, topic, score, totalQuestions, sessionId } = req.body;
        
        const limitCalc = await checkLimits(req.user, sessionId);
        if (!limitCalc.allowed) {
            return res.status(403).json({ error: limitCalc.reason });
        }

        if (req.user) {
            await db.execute(
                "INSERT INTO quiz_attempts (user_id, subject, topic, score, total_questions) VALUES (?, ?, ?, ?, ?)",
                [req.user.id, subject, topic, score, totalQuestions]
            );
        } else {
            await db.execute(
                "INSERT INTO quiz_attempts (session_id, subject, topic, score, total_questions) VALUES (?, ?, ?, ?, ?)",
                [sessionId, subject, topic, score, totalQuestions]
            );
        }

        res.json({ message: "Quiz result recorded successfully" });
    } catch (error) {
        console.error("Error recording quiz result:", error);
        res.status(500).json({ error: "Failed to save results" });
    }
};
