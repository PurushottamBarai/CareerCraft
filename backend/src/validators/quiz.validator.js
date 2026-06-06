export const validateGenerateQuiz = (req, res, next) => {
  const { subject, topic } = req.body;
  if (!subject || !topic) {
    return res.status(400).json({ error: "Subject and Topic are required" });
  }
  next();
};
