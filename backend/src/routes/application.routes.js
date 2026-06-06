import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { getJobApplications, getStudentApplications, submitApplication, updateApplicationStatus } from "../controllers/application.controller.js";
import { validateSubmitApplication, validateUpdateStatus } from "../validators/application.validator.js";

const router = express.Router();

router.get("/job/:jobId", auth, requireRole(["employer"]), getJobApplications);
router.get("/student", auth, requireRole(["student"]), getStudentApplications);
router.post("/", auth, requireRole(["student"]), upload.single("resume"), validateSubmitApplication, submitApplication);
router.patch("/:id/status", auth, requireRole(["employer"]), validateUpdateStatus, updateApplicationStatus);

export default router;
