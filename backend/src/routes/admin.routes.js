import express from "express";
import { adminAuth } from "../middlewares/auth.middleware.js";
import { getUsers, getStudents, getEmployers, getJobs, getApplications, getStats } from "../controllers/admin.controller.js";

const router = express.Router();

router.use(adminAuth);

router.get("/users", getUsers);
router.get("/students", getStudents);
router.get("/employers", getEmployers);
router.get("/jobs", getJobs);
router.get("/applications", getApplications);
router.get("/stats", getStats);

export default router;
