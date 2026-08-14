import { db } from "../db/database.js";

export const validateContact = async (req, res) => {
  try {
    const { email } = req.body;

    const [stuRows] = await db.query("SELECT id FROM students WHERE email = ?", [email]);
    const [compRows] = await db.query("SELECT id FROM companies WHERE email = ?", [email]);

    if (stuRows.length === 0 && compRows.length === 0) {
      return res.status(404).json({ message: "Email must be registered with an account." });
    }

    res.status(200).json({ message: "Validation passed." });
  } catch (error) {
    console.error("Error validating contact form:", error);
    res.status(500).json({ message: "Validation failed." });
  }
};
