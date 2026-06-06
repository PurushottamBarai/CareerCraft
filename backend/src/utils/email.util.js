import { Resend } from "resend";
import { db } from "../db/database.js";

let resendClient = null;

if (process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log("Email engine is ready via HTTP architecture");
} else {
  console.warn("Email API key not configured. Emails will gracefully fail soft.");
}

export const sendEmail = async (to, subject, html, userId, type) => {
  try {
    console.log(`Attempting to send email over HTTP API to: ${to}`);
    console.log(`Subject: ${subject}`);

    if (resendClient) {
      const { data, error } = await resendClient.emails.send({
        from: '"CareerCraft Support" <support@codedeck.me>',
        to: [to],
        subject: subject,
        html: html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Email successfully transmitted:", data?.id);

      if (db) {
        await db.query(
          "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, to, subject, html, type, "sent"],
        );
      }
    } else {
      console.log("Email API engine missing");

      if (db) {
        await db.query(
          "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
          [userId, to, subject, "Email service API not configured", type, "failed"],
        );
      }
    }
  } catch (error) {
    console.error("High level HTTP sending error:", error);

    if (db) {
      await db.query(
        "INSERT INTO email_notifications (userId, email, subject, message, type, status) VALUES (?, ?, ?, ?, ?, ?)",
        [userId, to, subject, error.message, type, "failed"],
      );
    }
  }
};
