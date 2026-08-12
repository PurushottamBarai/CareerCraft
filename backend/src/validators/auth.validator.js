export const validateRegister = (req, res, next) => {
  const { firstName, companyName, email, password, role } = req.body;
  const name = firstName || companyName;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: "Name/Company Name, email, password, and role are required" });
  }
  if (!["student", "employer"].includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email & password are required" });
  }
  next();
};
