import jwt from "jsonwebtoken";

const getToken = (req) => {
  const header = req.headers["authorization"];
  return header && header.startsWith("Bearer ") ? header.split(" ")[1] : null;
};

export const auth = (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  });
};

export const optionalAuth = (req, res, next) => {
  const token = getToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {}
  }
  next();
};

export const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export const adminAuth = (req, res, next) => {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }
    req.user = user;
    next();
  });
};
