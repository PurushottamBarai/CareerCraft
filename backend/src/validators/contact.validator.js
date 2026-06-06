export const validateContactForm = (req, res, next) => {
  const { email, phone, feedback } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required." });
  }

  if (feedback) {
    const words = feedback.trim().split(/\s+/);
    if (words.length > 100) {
      return res.status(400).json({ message: "Message cannot exceed 100 words." });
    }
  }

  if (phone) {
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid Phone Number" });
    }
  }

  next();
};
