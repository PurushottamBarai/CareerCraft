import { Resend } from "resend";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (resendClient) {
  console.log("Email engine ok");
} else {
  console.warn("Resend api key issue.");
}

export const sendEmail = async (to, subject, html, replyTo = null) => {
  if (!resendClient) {
    console.warn("Email engine issue.");
    return;
  }

  const fromEmail = `"CareerCraft" <${process.env.EMAIL_FROM}>`;

  try {
    const payload = {
      from: fromEmail,
      to: [to],
      subject,
      html,
    };

    if (replyTo) {
      payload.reply_to = replyTo;
    }

    const { data, error } = await resendClient.emails.send(payload);

    if (error) {
      throw new Error(error.message);
    }
    console.log(`Email sent to ${to} (${data?.id})`);
  } catch (error) {
    console.error("Email send error:", error.message);
  }
};
