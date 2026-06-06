import express from "express";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import { getAccessStatus, generateQuiz, recordQuizResult } from "../controllers/quiz.controller.js";
import { validateGenerateQuiz } from "../validators/quiz.validator.js";

const router = express.Router();

router.get("/status", optionalAuth, getAccessStatus);
router.post("/generate", optionalAuth, validateGenerateQuiz, generateQuiz);
router.post("/submit", optionalAuth, recordQuizResult);

export default router;
