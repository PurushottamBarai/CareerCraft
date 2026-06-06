import { db } from "../db/database.js";

export const validateContact = async (req, res) => {
  try {
    const { email, phone, feedback } = req.body;



    // 3. Database Check: Email must be registered in the users table
    const [rows] = await db.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Email must be registered with an account." });
    }

    res.status(200).json({ message: "Validation passed." });
  } catch (error) {
    console.error("Error validating contact form:", error);
    res.status(500).json({ message: "An error occurred during validation." });
  }
};
