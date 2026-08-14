import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/database.js";
import { sendEmail } from "../utils/email.util.js";
import { getFormattedDateTime } from "../utils/date.util.js";

const generateOtp = () => String(Math.floor(10000 + Math.random() * 90000));

const fetchUserProfile = async (userId, role) => {
  if (role === "admin") {
    return { id: userId, name: "Admin", firstName: "Admin", role: "admin" };
  } else if (
    role === "employer" ||
    role === "company" ||
    role === "recruiter"
  ) {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, officeAddress, registrationDate, 'employer' as role FROM companies WHERE id = ?",
      [userId],
    );
    return rows[0] || null;
  } else {
    const [rows] = await db.query(
      "SELECT id, name, email, phone, address, college, course, graduationYear, registrationDate, 'student' as role FROM students WHERE id = ?",
      [userId],
    );
    return rows[0] || null;
  }
};

const sendOtpEmail = async (email, otp, name) => {
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; background-color: #f6f8fa; padding: 30px;">
      <div style="max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #d0d7de; border-radius: 6px; padding: 24px;">
        <h2 style="color: #24292f; text-align: center;">CareerCraft</h2>
        <p>Please verify your email, <strong>${name}</strong></p>
        <p>Your email verification code is:</p>
        <div style="text-align: center; margin: 20px 0; font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otp}</div>
        <p style="font-size: 13px; color: #57606a;">This code is valid for 10 minutes and can only be used once.</p>
      </div>
    </div>
  `;
  await sendEmail(email, "CareerCraft – Email Verification Code", emailHtml);
};

export const register = async (req, res) => {
  try {
    const {
      firstName,
      name,
      email,
      password,
      role,
      companyName,
      college,
      course,
      graduationYear,
      phone,
      address,
      officeAddress,
    } = req.body;

    const userRole =
      role === "employer" || role === "recruiter" || role === "company"
        ? "employer"
        : "student";
    const displayName = name || firstName || companyName || "User";

    // Check existing email in target table
    const targetTable = userRole === "employer" ? "companies" : "students";
    const [existing] = await db.query(
      `SELECT id, isEmailVerified FROM ${targetTable} WHERE email = ?`,
      [email],
    );
    if (existing.length > 0) {
      if (existing[0].isEmailVerified) {
        return res
          .status(400)
          .json({ message: "User with this email already exists" });
      } else {
        await db.query(`DELETE FROM ${targetTable} WHERE id = ?`, [
          existing[0].id,
        ]);
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const regDate = getFormattedDateTime();

    const registrationPayload = {
      name: displayName,
      email,
      password: hashedPassword,
      role: userRole,
      phone: phone || null,
      address: address || null,
      officeAddress: officeAddress || address || null,
      college: college || null,
      course: course || null,
      graduationYear: graduationYear || null,
      registrationDate: regDate,
    };

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const verificationToken = jwt.sign(
      { email, hashedOtp, payload: registrationPayload },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

    console.log(`[OTP] Generated for ${email}: ${otp}`);
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
        displayName = decoded.payload?.name || "User";
        payload = decoded.payload;
      } catch (e) {}
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const newVerificationToken = jwt.sign(
      { email, hashedOtp, payload },
      process.env.JWT_SECRET,
      { expiresIn: "10m" },
    );

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
      return res
        .status(400)
        .json({
          message:
            "Verification token missing or expired. Please request a new OTP.",
        });
    }

    let decoded;
    try {
      decoded = jwt.verify(verificationToken, process.env.JWT_SECRET);
    } catch (err) {
      return res
        .status(400)
        .json({
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
      const p = decoded.payload;
      const regDate = p.registrationDate || getFormattedDateTime();

      if (p.role === "employer") {
        await db.query(
          `INSERT INTO companies (name, email, password, phone, officeAddress, registrationDate, isEmailVerified)
           VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
          [p.name, p.email, p.password, p.phone, p.officeAddress, regDate],
        );
      } else {
        await db.query(
          `INSERT INTO students (name, email, password, phone, address, college, course, graduationYear, registrationDate, isEmailVerified)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
          [
            p.name,
            p.email,
            p.password,
            p.phone,
            p.address,
            p.college,
            p.course,
            p.graduationYear,
            regDate,
          ],
        );
      }

      return res.json({
        message:
          "Account registered and email verified successfully! You can now login.",
      });
    }

    res.json({ message: "Email verified successfully! You can now login." });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res
      .status(500)
      .json({ message: "Verification failed", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Admin login verification using .env
    if (
      process.env.ADMIN_USERNAME &&
      process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: 9999, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );
      return res.json({
        user: { id: 9999, name: process.env.ADMIN_USERNAME, firstName: process.env.ADMIN_USERNAME, role: "admin" },
        token,
      });
    }

    // Search in students
    const [stuRows] = await db.query("SELECT * FROM students WHERE email = ?", [
      email,
    ]);
    if (stuRows.length > 0) {
      const student = stuRows[0];
      const valid = await bcrypt.compare(password, student.password);
      if (!valid)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: student.id, role: "student", email: student.email },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );
      delete student.password;
      student.firstName = student.name;
      student.role = "student";
      return res.json({ user: student, token });
    }

    // Search in companies
    const [compRows] = await db.query(
      "SELECT * FROM companies WHERE email = ?",
      [email],
    );
    if (compRows.length > 0) {
      const company = compRows[0];
      const valid = await bcrypt.compare(password, company.password);
      if (!valid)
        return res.status(401).json({ message: "Invalid credentials" });

      const token = jwt.sign(
        { id: company.id, role: "employer", email: company.email },
        process.env.JWT_SECRET,
        { expiresIn: "8h" },
      );
      delete company.password;
      company.firstName = company.name;
      company.companyName = company.name;
      company.role = "employer";
      return res.json({ user: company, token });
    }

    return res.status(400).json({ message: "User not found" });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await fetchUserProfile(req.user.id, req.user.role);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.firstName = user.name;
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
      name,
      phone,
      address,
      officeAddress,
      companyName,
      college,
      course,
      graduationYear,
    } = req.body;
    const userId = req.user.id;
    const role = req.user.role;
    const displayName = name || firstName || companyName;

    if (role === "employer" || role === "company" || role === "recruiter") {
      await db.query(
        "UPDATE companies SET name = ?, phone = ?, officeAddress = ? WHERE id = ?",
        [displayName, phone || null, officeAddress || address || null, userId],
      );
    } else {
      await db.query(
        "UPDATE students SET name = ?, phone = ?, address = ?, college = ?, course = ?, graduationYear = ? WHERE id = ?",
        [
          displayName,
          phone || null,
          address || null,
          college || null,
          course || null,
          graduationYear || null,
          userId,
        ],
      );
    }

    const updatedUser = await fetchUserProfile(userId, role);
    if (updatedUser) updatedUser.firstName = updatedUser.name;
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
    const userId = req.user.id;
    const role = req.user.role;
    if (role === "employer" || role === "company") {
      await db.query("DELETE FROM companies WHERE id = ?", [userId]);
    } else {
      await db.query("DELETE FROM students WHERE id = ?", [userId]);
    }
    res.json({ message: "Profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile:", error);
    res.status(500).json({ message: "Failed to delete profile" });
  }
};
