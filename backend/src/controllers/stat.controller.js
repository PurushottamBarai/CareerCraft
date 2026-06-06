import { db } from "../db/database.js";

export const getEmployerStats = async (req, res) => {
  try {
    const [jobStats] = await db.query(
      "SELECT COUNT(*) as totalJobs FROM jobs WHERE employerId = ?",
      [req.user.id],
    );

    const [appStats] = await db.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE j.employerId = ?`,
      [req.user.id],
    );

    res.json({
      totalJobs: jobStats[0].totalJobs || 0,
      totalApplications: appStats[0].totalApplications || 0,
      pendingApplications: appStats[0].pendingApplications || 0,
      acceptedApplications: appStats[0].acceptedApplications || 0,
      rejectedApplications: appStats[0].rejectedApplications || 0,
    });
  } catch (error) {
    console.error("Error fetching employer stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const [stats] = await db.query(
      `SELECT 
        COUNT(*) as totalApplications,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications
       WHERE studentId = ?`,
      [req.user.id],
    );

    res.json({
      totalApplications: stats[0].totalApplications || 0,
      pendingApplications: stats[0].pendingApplications || 0,
      acceptedApplications: stats[0].acceptedApplications || 0,
      rejectedApplications: stats[0].rejectedApplications || 0,
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
