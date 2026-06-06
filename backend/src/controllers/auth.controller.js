import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database.js";
import { sendEmail } from "../utils/email.util.js";

export const register = async (req, res) => {
  try {
    const {
      firstName,
      username,
      email,
      password,
      role,
      companyName,
      course,
      graduationYear,
      phone,
      address,
    } = req.body;

    const [existingUsers] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const finalUsername =
      username ||
      email.split("@")[0] + "_" + Math.floor(Math.random() * 100000);

    const [result] = await db.query(
      `INSERT INTO users (firstName, lastName, username, email, password, role, phone, address)
       VALUES (?, '', ?, ?, ?, ?, ?, ?)`,
      [
        firstName,
        finalUsername,
        email,
        hashedPassword,
        role,
        phone || null,
        address || null,
      ],
    );

    const newUserId = result.insertId;

    if (role === 'student') {
      await db.query(
        `INSERT INTO student_profiles (userId, college, course, graduationYear) VALUES (?, ?, ?, ?)`,
        [newUserId, college || '', course || '', graduationYear || 0]
      );
    } else if (role === 'employer') {
      await db.query(
        `INSERT INTO employer_profiles (userId, companyName) VALUES (?, ?)`,
        [newUserId, companyName || '']
      );
    }

    const emailHtml = `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; padding: 40px 20px; margin: 0;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);">
          <div style="padding: 30px 40px; border-bottom: 1px solid #e5e7eb;">
            <h2 style="margin: 0; color: #000000; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">CareerCraft</h2>
          </div>
          <div style="padding: 40px;">
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin-top: 0; margin-bottom: 20px; font-weight: 500;">Dear ${firstName},</p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
              Thank you for joining CareerCraft. Your <strong>${role}</strong> account is now active, and we are glad to have you on board.
            </p>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Please log in below to access your account and explore the platform.
            </p>
            <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
              <tr>
                <td align="center" bgcolor="#000000" style="border-radius: 6px;">
                  <a href="https://careercraft-gebt.onrender.com" target="_blank" style="display: inline-block; padding: 12px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 6px; border: 1px solid #000000;">
                    Log In
                  </a>
                </td>
              </tr>
            </table>
            <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
              Need help getting started? Just reply to this email, and our support team will assist you.
            </p>
            <p style="color: #000000; font-size: 16px; line-height: 1.6; margin-bottom: 0;">
              Best regards,<br><br>
              <strong>The CareerCraft Team</strong>
            </p>
          </div>
          <div style="background-color: #fafafa; padding: 30px 40px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0;">
              © 2026 CareerCraft. All rights reserved.<br>
              You are receiving this email because you recently created a ${role} account.
            </p>
          </div>
        </div>
      </div>
    `;

    await sendEmail(email, "Welcome to CareerCraft", emailHtml, result.insertId, "registration");

    res.status(201).json({ message: "Registration successful!", userId: result.insertId });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // First check if it's an admin login
    const [adminRows] = await db.query(
      "SELECT * FROM admin WHERE username = ?",
      [email],
    );

    if (adminRows.length > 0) {
      const admin = adminRows[0];

      let valid = false;
      if (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$")) {
        valid = await bcrypt.compare(password, admin.password);
      } else {
        valid = password === admin.password;
      }

      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: "admin" },
        process.env.JWT_SECRET || "fallback_secret_for_dev_only",
        { expiresIn: "8h" },
      );

      return res.json({
        user: { username: admin.username, firstName: "Admin", lastName: "User", role: "admin" },
        token,
      });
    }

    // Check regular users
    const [rows] = await db.query(
      `SELECT u.*, 
              s.college, s.course, s.graduationYear, 
              e.companyName 
       FROM users u 
       LEFT JOIN student_profiles s ON u.id = s.userId 
       LEFT JOIN employer_profiles e ON u.id = e.userId 
       WHERE u.email = ? OR u.username = ?`,
      [email, email],
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "User not found" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await db.query("UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?", [user.id]);

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "fallback_secret_for_dev_only",
      { expiresIn: "8h" },
    );

    delete user.password;
    delete user.emailVerificationToken;

    res.json({ user, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT u.id, u.firstName, u.lastName, u.username, u.email, u.role, u.phone, u.address, u.profileImage, u.createdAt,
              e.companyName, s.college, s.course, s.graduationYear
       FROM users u
       LEFT JOIN student_profiles s ON u.id = s.userId
       LEFT JOIN employer_profiles e ON u.id = e.userId
       WHERE u.id = ?`,
      [req.user.id],
    );

    if (users.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, address, companyName, college, course, graduationYear } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    // Update core user table
    await db.query(
      "UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [firstName || null, lastName || null, phone || null, address || null, userId],
    );

    if (role === "employer") {
      await db.query(
        "INSERT INTO employer_profiles (userId, companyName) VALUES (?, ?) ON DUPLICATE KEY UPDATE companyName = ?",
        [userId, companyName || null, companyName || null],
      );
    } else if (role === "student") {
      await db.query(
        "INSERT INTO student_profiles (userId, college, course, graduationYear) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE college = ?, course = ?, graduationYear = ?",
        [userId, college || null, course || null, graduationYear || null, college || null, course || null, graduationYear || null],
      );
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
};
