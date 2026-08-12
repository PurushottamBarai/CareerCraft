import { Resend } from "resend";

const resendClient = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

if (resendClient) {
  console.log("Email engine ok");
} else {
  console.warn("Resend api key issue.");
}

export const sendEmail = async (to, subject, html) => {
  if (!resendClient) {
    console.warn("Email engine issue.");
    return;
  }

  try {
    const { data, error } = await resendClient.emails.send({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      html,
    });

    if (error) {
      throw new Error(error.message);
    }
    console.log(`Email sent to ${to} (${data?.id})`);
  } catch (error) {
    console.error("Email send error:", error.message);
  }
};
