import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database.js";
import { sendEmail } from "../utils/email.util.js";

const generateOtp = () => String(Math.floor(10000 + Math.random() * 90000));

const sendOtpEmail = async (email, otp, name, userId = null) => {
  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f6f8fa; padding: 40px 20px;">
      <div style="max-width: 480px; margin: 0 auto;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 22px; font-weight: 700; color: #24292f; letter-spacing: -0.3px;">CareerCraft</span>
        </div>

        <h1 style="text-align: center; font-size: 20px; font-weight: 400; color: #24292f; margin: 0 0 24px 0;">
          Please verify your email, <strong>${name}</strong>
        </h1>

        <div style="background-color: #ffffff; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px; margin-bottom: 16px;">
          <p style="color: #24292f; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
            Here is your CareerCraft email verification code:
          </p>

          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 32px; font-weight: 600; letter-spacing: 6px; color: #24292f;">${otp}</span>
          </div>

          <p style="color: #24292f; font-size: 14px; line-height: 1.5; margin: 0 0 8px 0;">
            This code is valid for <strong>10 minutes</strong> and can only be used once.
          </p>

          <p style="color: #24292f; font-size: 14px; line-height: 1.5; margin: 0 0 16px 0;">
            <strong>Please don't share this code with anyone:</strong> we'll never ask for it on the phone or via email.
          </p>

          <p style="color: #24292f; font-size: 14px; line-height: 1.5; margin: 0;">
            Thanks,<br>
            The CareerCraft Team
          </p>
        </div>

        <p style="color: #57606a; font-size: 12px; line-height: 1.5; text-align: center; margin: 0 0 16px 0;">
          You're receiving this email because a verification code was requested for your CareerCraft account. If this wasn't you, please ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #d8dee4; margin: 16px 0;">

        <p style="color: #8c959f; font-size: 12px; text-align: center; margin: 0;">
          CareerCraft, Mumbai 400101
        </p>
      </div>
    </div>
  `;
  await sendEmail(email, 'CareerCraft – Email Verification Code', emailHtml, userId, 'otp');
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      username,
      email,
      password,
      role,
      companyName,
      college,
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

    const displayName = firstName || companyName || 'User';

    const registrationPayload = JSON.stringify({
      firstName: displayName,
      username: finalUsername,
      email,
      password: hashedPassword,
      role: role || 'employer',
      phone: phone || null,
      address: address || null,
      companyName: companyName || '',
      college: college || '',
      course: course || '',
      graduationYear: graduationYear || 0,
    });

    // Generate and store OTP + pending payload (User is NOT inserted into DB yet)
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await db.query(
      'DELETE FROM otp_verifications WHERE email = ?',
      [email]
    );
    await db.query(
      'INSERT INTO otp_verifications (email, otp, expiresAt, payload) VALUES (?, ?, ?, ?)',
      [email, otp, expiresAt, registrationPayload]
    );

    console.log(`[OTP] Generated for pending registration ${email}: ${otp}`);
    await sendOtpEmail(email, otp, displayName);

    res.status(201).json({ message: 'Registration initiated! Please check your email for the OTP.', email });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const [users] = await db.query('SELECT id, firstName FROM users WHERE email = ?', [email]);
    
    let displayName = 'User';
    let userId = null;
    let existingPayload = null;

    if (users.length > 0) {
      displayName = users[0].firstName || 'User';
      userId = users[0].id;
    } else {
      const [pending] = await db.query('SELECT payload FROM otp_verifications WHERE email = ? LIMIT 1', [email]);
      if (pending.length === 0 || !pending[0].payload) {
        return res.status(404).json({ message: 'No pending registration or account found with this email' });
      }
      try {
        const parsed = JSON.parse(pending[0].payload);
        displayName = parsed.firstName || 'User';
        existingPayload = pending[0].payload;
      } catch (e) {
        return res.status(404).json({ message: 'No valid registration found with this email' });
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
    await db.query('INSERT INTO otp_verifications (email, otp, expiresAt, payload) VALUES (?, ?, ?, ?)', [email, otp, expiresAt, existingPayload]);

    console.log(`[OTP] Resent for ${email}: ${otp}`);
    await sendOtpEmail(email, otp, displayName, userId);

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const [rows] = await db.query(
      'SELECT * FROM otp_verifications WHERE email = ? ORDER BY createdAt DESC LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'No OTP found for this email. Please register or request a new OTP.' });
    }

    const record = rows[0];

    if (new Date() > new Date(record.expiresAt)) {
      await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (record.otp !== String(otp)) {
      return res.status(400).json({ message: 'Incorrect OTP. Please try again.' });
    }

    // Check if this is a pending registration
    if (record.payload) {
      let userData;
      try {
        userData = JSON.parse(record.payload);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid registration payload' });
      }

      // Check if user was created in parallel
      const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
      if (existing.length > 0) {
        await db.query('UPDATE users SET emailVerified = TRUE WHERE email = ?', [email]);
        await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
        return res.json({ message: 'Email verified successfully! You can now login.' });
      }

      // NOW insert user into database upon successful OTP verification
      const [result] = await db.query(
        `INSERT INTO users (firstName, lastName, username, email, password, role, phone, address, emailVerified)
         VALUES (?, '', ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          userData.firstName,
          userData.username,
          userData.email,
          userData.password,
          userData.role,
          userData.phone,
          userData.address,
        ]
      );

      const newUserId = result.insertId;

      if (userData.role === 'student') {
        await db.query(
          `INSERT INTO student_profiles (userId, college, course, graduationYear) VALUES (?, ?, ?, ?)`,
          [newUserId, userData.college || '', userData.course || '', userData.graduationYear || 0]
        );
      } else if (userData.role === 'employer') {
        await db.query(
          `INSERT INTO employer_profiles (userId, companyName) VALUES (?, ?)`,
          [newUserId, userData.companyName || '']
        );
      }

      await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);
      return res.json({ message: 'Account registered and email verified successfully! You can now login.' });
    }

    // Standard verification for existing user
    await db.query('UPDATE users SET emailVerified = TRUE WHERE email = ?', [email]);
    await db.query('DELETE FROM otp_verifications WHERE email = ?', [email]);

    res.json({ message: 'Email verified successfully! You can now login.' });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ message: 'Verification failed' });
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

    // Block unverified users
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: "Please verify your email first. Check your inbox for the OTP.",
        unverified: true,
        email: user.email
      });
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
