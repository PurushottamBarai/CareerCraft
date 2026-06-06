export const validateCreateJob = (req, res, next) => {
  const { title, description, skills, location } = req.body;
  if (!title || !description || !skills || !location) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ message: "At least one skill is required" });
  }
  next();
};
