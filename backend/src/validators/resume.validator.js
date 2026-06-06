export const validateGenerateResume = (req, res, next) => {
  const resumeData = req.body;
  if (
    !resumeData.personalInfo ||
    !resumeData.personalInfo.name ||
    !resumeData.personalInfo.email ||
    !resumeData.personalInfo.phone ||
    !resumeData.education ||
    resumeData.education.length === 0 ||
    !resumeData.skills ||
    resumeData.skills.length === 0
  ) {
    return res.status(400).json({ message: "Please fill in all required fields marked with *." });
  }
  next();
};
