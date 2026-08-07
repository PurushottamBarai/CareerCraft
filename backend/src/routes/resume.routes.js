import express from "express";
import { optionalAuth } from "../middlewares/auth.middleware.js";
import { generateResume, enhanceResumeText } from "../controllers/resume.controller.js";
import { validateGenerateResume } from "../validators/resume.validator.js";

const router = express.Router();

router.post("/generate", optionalAuth, validateGenerateResume, generateResume);
router.post("/enhance", enhanceResumeText);

export default router;
