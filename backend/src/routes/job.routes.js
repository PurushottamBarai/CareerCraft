import express from "express";
import { auth, requireRole } from "../middlewares/auth.middleware.js";
import { getEmployerJobs, getJobs, createJob, deleteJob } from "../controllers/job.controller.js";
import { validateCreateJob } from "../validators/job.validator.js";

const router = express.Router();

router.use(auth);

router.get("/", getJobs);
router.get("/employer", requireRole(["employer"]), getEmployerJobs);
router.post("/", requireRole(["employer"]), validateCreateJob, createJob);
router.delete("/:id", requireRole(["employer"]), deleteJob);

export default router;
