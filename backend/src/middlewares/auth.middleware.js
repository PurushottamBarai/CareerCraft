import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, user) => {
      if (err) {
        console.log("Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid token" });
      }
      req.user = user;
      next();
    },
  );
};

export const optionalAuth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return next();
  const token = header.split(" ")[1];
  if (!token) return next();
  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, user) => {
      if (!err) req.user = user;
      next();
    },
  );
};

export const requireRole = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

export const adminAuth = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];
  if (!token) {
    return res.status(403).json({ message: "Admin access required" });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || "fallback_secret_for_dev_only",
    (err, decoded) => {
      if (err || decoded.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      req.user = decoded;
      next();
    },
  );
};
