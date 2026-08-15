import express from "express";
import { handleContactMessage } from "../controllers/contact.controller.js";
import { validateContactForm } from "../validators/contact.validator.js";

const router = express.Router();

router.post("/", validateContactForm, handleContactMessage);

export default router;
