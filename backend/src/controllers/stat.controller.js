import { db } from "../db/database.js";

export const getEmployerStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
      `SELECT 
        (SELECT COUNT(*) FROM jobs WHERE employerId = ?) as totalJobs,
        COUNT(a.id) as totalApplications,
        SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) as pendingApplications,
        SUM(CASE WHEN a.status = 'accepted' THEN 1 ELSE 0 END) as acceptedApplications,
        SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) as rejectedApplications
       FROM applications a
       INNER JOIN jobs j ON a.jobId = j.id
       WHERE j.employerId = ?`,
      [req.user.id, req.user.id],
    );

    res.json({
      totalJobs: Number(stats?.totalJobs || 0),
      totalApplications: Number(stats?.totalApplications || 0),
      pendingApplications: Number(stats?.pendingApplications || 0),
      acceptedApplications: Number(stats?.acceptedApplications || 0),
      rejectedApplications: Number(stats?.rejectedApplications || 0),
    });
  } catch (error) {
    console.error("Error fetching employer stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};

export const getStudentStats = async (req, res) => {
  try {
    const [[stats]] = await db.query(
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
      totalApplications: Number(stats?.totalApplications || 0),
      pendingApplications: Number(stats?.pendingApplications || 0),
      acceptedApplications: Number(stats?.acceptedApplications || 0),
      rejectedApplications: Number(stats?.rejectedApplications || 0),
    });
  } catch (error) {
    console.error("Error fetching student stats:", error);
    res.status(500).json({ message: "Failed to fetch statistics" });
  }
};
