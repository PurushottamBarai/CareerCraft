import { sendEmail } from "../utils/email.util.js";

export const handleContactMessage = async (req, res) => {
  try {
    const { name, email, userType, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email, and message are required." });
    }

    const recipient = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM;

    if (!recipient) {
      console.error("No support recipient email configured in environment variables.");
      return res.status(500).json({ message: "Email configuration error on server." });
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #24292f; max-width: 600px; margin: 0 auto; border: 1px solid #e1e4e8; border-radius: 8px;">
        <h2 style="color: #0366d6; margin-top: 0;">New Contact Form Message</h2>
        <p><strong>From:</strong> ${name} (&lt;${email}&gt;)</p>
        <p><strong>User Role:</strong> ${userType || "Student"}</p>
        <hr style="border: none; border-top: 1px solid #e1e4e8; margin: 20px 0;" />
        <p style="font-weight: bold; margin-bottom: 8px;">Message:</p>
        <div style="background-color: #f6f8fa; padding: 16px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; line-height: 1.5; color: #24292f;">${message}</div>
        <p style="font-size: 12px; color: #586069; margin-top: 20px;">You can directly reply to this email to respond to ${name}.</p>
      </div>
    `;

    await sendEmail(
      recipient,
      `New Contact Message from ${name}`,
      emailHtml,
      email
    );

    return res.status(200).json({ message: "Your message has been sent successfully." });
  } catch (error) {
    console.error("Error sending contact email:", error);
    return res.status(500).json({ message: "Failed to send message. Please try again." });
  }
};
