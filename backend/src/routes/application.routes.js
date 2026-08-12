import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import {
  getJobApplications,
  getStudentApplications,
  submitApplication,
  updateApplicationStatus,
} from "../controllers/application.controller.js";
import {
  validateSubmitApplication,
  validateUpdateStatus,
} from "../validators/application.validator.js";

const router = express.Router();

router.use(auth);

const handleUploadMiddleware = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    next();
  });
};

router.get("/student", requireRole(["student"]), getStudentApplications);
router.get("/job/:jobId", requireRole(["employer"]), getJobApplications);
router.post("/", requireRole(["student"]), handleUploadMiddleware, validateSubmitApplication, submitApplication);
router.patch("/:id/status", requireRole(["employer"]), validateUpdateStatus, updateApplicationStatus);

export default router;
