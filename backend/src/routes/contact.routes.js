import express from "express";
import { validateContact } from "../controllers/contact.controller.js";
import { validateContactForm } from "../validators/contact.validator.js";

const router = express.Router();

router.post("/validate", validateContactForm, validateContact);

export default router;
