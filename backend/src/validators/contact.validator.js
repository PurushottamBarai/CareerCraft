export const validateContactForm = (req, res, next) => {
  const { email, message, feedback } = req.body;
  const msg = message || feedback;

  if (!email || !email.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  if (msg && msg.trim().length > 1000) {
    return res.status(400).json({ message: "Message is too long" });
  }

  next();
};
