export const validateSubmitApplication = (req, res, next) => {
  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ message: "Job ID is required" });
  }
  next();
};

export const validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  if (!["pending", "accepted", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }
  next();
};
