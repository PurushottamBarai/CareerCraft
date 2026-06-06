export const validateRegister = (req, res, next) => {
  const { firstName, email, password, role } = req.body;
  if (!firstName || !email || !password || !role) {
    return res.status(400).json({ message: "First name, email, password, and role are required" });
  }
  if (!["student", "employer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  next();
};
