import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database.js";
import { sendEmail } from "../utils/email.util.js";

const generateOtp = () => String(Math.floor(10000 + Math.random() * 90000));

const fetchFullUserProfile = async (userId) => {
  const [users] = await db.query(
    `SELECT u.id, u.firstName, u.lastName, u.username, u.email, u.role, u.phone, u.address, u.profileImage, u.createdAt,
            e.companyName, s.college, s.course, s.graduationYear
     FROM users u
     LEFT JOIN student_profiles s ON u.id = s.userId
     LEFT JOIN employer_profiles e ON u.id = e.userId
     WHERE u.id = ?`,
    [userId],
  );
  return users[0] || null;
};

const sendOtpEmail = async (email, otp, name) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 30px;">

  <div style="max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px;">

    <h2 style="
      color: #24292f;
      text-align: center;
      margin: 0 0 28px 0;
      font-size: 20px;
      font-weight: 600;
    ">
      CareerCraft
    </h2>

    <p style="
      color: #24292f;
      font-size: 14px;
      margin: 0 0 24px 0;
    ">
      Please verify your email, <strong>${name}</strong>
    </p>

    <p style="
      color: #24292f;
      font-size: 13px;
      margin: 0 0 18px 0;
    ">
      Here is your CareerCraft email verification code:
    </p>

    <div style="
      text-align: center;
      margin: 20px 0 22px 0;
      font-size: 28px;
      font-weight: bold;
      letter-spacing: 4px;
      color: #24292f;
    ">
      ${otp}
    </div>

    <p style="
      color: #24292f;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 8px 0;
    ">
      This code is valid for <strong>10 minutes</strong> and can only be used once.
    </p>

    <p style="
      color: #24292f;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 18px 0;
    ">
      <strong>Please don't share this code with anyone:</strong> we'll never ask for it on
      the phone or via email.
    </p>

    <p style="
      color: #24292f;
      font-size: 13px;
      line-height: 1.5;
      margin: 0 0 8px 0;
    ">
      Thanks,
    </p>

    <p style="
      color: #24292f;
      font-size: 13px;
      line-height: 1.5;
      margin: 0;
    ">
      The CareerCraft Team
    </p>

    <div style="
      color: #57606a;
      font-size: 16px;
      font-weight: bold;
      letter-spacing: 1px;
      margin-top: 4px;
    ">
      •••
    </div>

  </div>
</div>
  `;
  await sendEmail(email, "CareerCraft – Please verify your email", emailHtml);
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
      "SELECT id, isEmailVerified FROM users WHERE email = ?",
      [email],
    );
    if (existingUsers.length > 0) {
      if (existingUsers[0].isEmailVerified) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      } else {
        await db.query("DELETE FROM users WHERE id = ?", [existingUsers[0].id]);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const finalUsername =
      username ||
      `${email.split("@")[0]}_${Math.floor(Math.random() * 100000)}`;
    const displayName = firstName || companyName || "User";

    const registrationPayload = {
      firstName: displayName,
      username: finalUsername,
      email,
      password: hashedPassword,
      role: role || "student",
      phone: phone || null,
      address: address || null,
      companyName: companyName || "",
      college: college || "",
      course: course || "",
      graduationYear: graduationYear || 0,
    };

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const verificationToken = jwt.sign(
      { email, hashedOtp, payload: registrationPayload },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    console.log(`[OTP] Generated for pending registration ${email}: ${otp}`);
    await sendOtpEmail(email, otp, displayName);

    res.status(201).json({
      message: "Registration initiated! Please check your email for the OTP.",
      email,
      verificationToken,
    });
  } catch (err) {
    console.error("Registration error:", err);
    res
      .status(500)
      .json({ message: "Registration failed", error: err.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { email, verificationToken } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    let displayName = "User";
    let payload = null;

    if (verificationToken) {
      try {
        const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
        displayName = decoded.payload?.firstName || "User";
        payload = decoded.payload;
      } catch (e) {}
    }

    if (!payload) {
      const [users] = await db.query(
        "SELECT id, firstName FROM users WHERE email = ?",
        [email],
      );
      if (users.length > 0) {
        displayName = users[0].firstName || "User";
      }
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const newVerificationToken = jwt.sign(
      { email, hashedOtp, payload },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    console.log(`[OTP] Resent for ${email}: ${otp}`);
    await sendOtpEmail(email, otp, displayName);

    res.json({
      message: "OTP sent successfully",
      verificationToken: newVerificationToken,
    });
  } catch (err) {
    console.error("Send OTP error:", err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp, verificationToken } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP are required" });

    if (!verificationToken) {
      return res.status(400).json({
        message:
          "Verification token missing or expired. Please request a new OTP.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({
        message:
          "OTP has expired or token is invalid. Please request a new OTP.",
      });
    }

    if (decoded.email !== email) {
      return res
        .status(400)
        .json({ message: "Verification token does not match email." });
    }

    const isMatch = await bcrypt.compare(String(otp), decoded.hashedOtp);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Incorrect OTP. Please try again." });
    }

    if (decoded.payload) {
      const userData = decoded.payload;
      const [existing] = await db.query(
        "SELECT id FROM users WHERE email = ?",
        [email],
      );

      if (existing.length > 0) {
        await db.query(
          "UPDATE users SET isEmailVerified = TRUE WHERE email = ?",
          [email],
        );
        return res.json({
          message: "Email verified successfully! You can now login.",
        });
      }

      const [result] = await db.query(
        `INSERT INTO users (firstName, lastName, username, email, password, role, phone, address, isEmailVerified)
         VALUES (?, '', ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          userData.firstName,
          userData.username,
          userData.email,
          userData.password,
          userData.role,
          userData.phone,
          userData.address,
        ],
      );

      const newUserId = result.insertId;
      if (userData.role === "student") {
        await db.query(
          "INSERT INTO student_profiles (userId, college, course, graduationYear) VALUES (?, ?, ?, ?)",
          [
            newUserId,
            userData.college || "",
            userData.course || "",
            userData.graduationYear || 0,
          ],
        );
      } else if (userData.role === "employer") {
        await db.query(
          "INSERT INTO employer_profiles (userId, companyName) VALUES (?, ?)",
          [newUserId, userData.companyName || ""],
        );
      }

      return res.json({
        message:
          "Account registered and email verified successfully! You can now login.",
      });
    }

    await db.query("UPDATE users SET isEmailVerified = TRUE WHERE email = ?", [
      email,
    ]);
    res.json({ message: "Email verified successfully! You can now login." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Verification failed" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const [adminRows] = await db.query(
      "SELECT * FROM admin WHERE username = ?",
      [email],
    );
    if (adminRows.length > 0) {
      const admin = adminRows[0];
      const valid =
        admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$")
          ? await bcrypt.compare(password, admin.password)
          : password === admin.password;

      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: admin.id, username: admin.username, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );

      return res.json({
        user: {
          username: admin.username,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
        },
        token,
      });
    }

    const [rows] = await db.query(
      `SELECT u.*, s.college, s.course, s.graduationYear, e.companyName 
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

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message:
          "Please verify your email first. Check your inbox for the OTP.",
        unverified: true,
        email: user.email,
      });
    }

    await db.query(
      "UPDATE users SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    );
    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
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
    const user = await fetchFullUserProfile(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      companyName,
      college,
      course,
      graduationYear,
    } = req.body;
    const userId = req.user.id;

    let role = req.user.role;
    if (!role) {
      const [userRows] = await db.query("SELECT role FROM users WHERE id = ?", [
        userId,
      ]);
      if (userRows.length > 0) {
        role = userRows[0].role;
      }
    }

    if (!firstName || !firstName.trim()) {
      return res.status(400).json({ message: "First name is required" });
    }

    await db.query(
      "UPDATE users SET firstName = ?, lastName = ?, phone = ?, address = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [
        firstName.trim(),
        lastName ? lastName.trim() : "",
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        userId,
      ],
    );

    if (role === "employer") {
      await db.query(
        `INSERT INTO employer_profiles (userId, companyName) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE companyName = VALUES(companyName)`,
        [userId, companyName ? companyName.trim() : ""],
      );
    } else if (role === "student") {
      const parsedGradYear = graduationYear
        ? parseInt(graduationYear, 10)
        : null;
      const validYear = isNaN(parsedGradYear) ? null : parsedGradYear;
      await db.query(
        `INSERT INTO student_profiles (userId, college, course, graduationYear) 
         VALUES (?, ?, ?, ?) 
         ON DUPLICATE KEY UPDATE college = VALUES(college), course = VALUES(course), graduationYear = VALUES(graduationYear)`,
        [
          userId,
          college ? college.trim() : "",
          course ? course.trim() : "",
          validYear,
        ],
      );
    }

    const updatedUser = await fetchFullUserProfile(userId);
    res.json({ message: "Profile updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "Failed to update profile", error: error.message });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = ?", [req.user.id]);
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
};
