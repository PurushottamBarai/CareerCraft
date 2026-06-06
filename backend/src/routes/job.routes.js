import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { getEmployerJobs, getJobs, createJob, deleteJob } from "../controllers/job.controller.js";
import { validateCreateJob } from "../validators/job.validator.js";

const router = express.Router();

router.get("/employer", auth, requireRole(["employer"]), getEmployerJobs);
router.get("/", auth, getJobs);
router.post("/", auth, requireRole(["employer"]), validateCreateJob, createJob);
router.delete("/:id", auth, requireRole(["employer"]), deleteJob);

export default router;
