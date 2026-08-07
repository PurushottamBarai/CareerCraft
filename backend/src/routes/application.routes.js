import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { getJobApplications, getStudentApplications, submitApplication, updateApplicationStatus } from "../controllers/application.controller.js";
import { validateSubmitApplication, validateUpdateStatus } from "../validators/application.validator.js";

const router = express.Router();

const handleUploadMiddleware = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message || "Invalid file upload" });
    }
    next();
  });
};

router.get("/job/:jobId", auth, requireRole(["employer"]), getJobApplications);
router.get("/student", auth, requireRole(["student"]), getStudentApplications);
router.post("/", auth, requireRole(["student"]), handleUploadMiddleware, validateSubmitApplication, submitApplication);
router.patch("/:id/status", auth, requireRole(["employer"]), validateUpdateStatus, updateApplicationStatus);

export default router;
