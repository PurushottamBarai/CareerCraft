import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { getEmployerStats, getStudentStats } from "../controllers/stat.controller.js";

const router = express.Router();

router.get("/employer", auth, requireRole(["employer"]), getEmployerStats);
router.get("/student", auth, requireRole(["student"]), getStudentStats);

export default router;
