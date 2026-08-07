import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/employer-dashboard.css';

const SKILL_OPTIONS = [
  'JavaScript', 'Python', 'Java', 'React', 'Node.js',
  'SQL', 'HTML/CSS', 'PHP', 'C++', 'Angular', 'Vue.js', 'MongoDB'
];

const EmployerDashboard = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('post');
  const [stats, setStats] = useState({
    totalJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0
  });

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [posting, setPosting] = useState(false);

  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [customSkill, setCustomSkill] = useState('');
  const [experienceYears, setExperienceYears] = useState(0);
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!customSkill.trim()) return;
    const newSkill = customSkill.trim();
    if (!selectedSkills.includes(newSkill)) {
      setSelectedSkills([...selectedSkills, newSkill]);
    }
    setCustomSkill('');
  };

  // Applications Modal State
  const [appsModal, setAppsModal] = useState({ open: false, job: null });
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchEmployerJobs();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/employer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Employer stats fetch error:', err);
    }
  };

  const fetchEmployerJobs = async () => {
    setLoadingJobs(true);
    try {
      const res = await fetch(`${API_BASE}/jobs/employer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Employer jobs fetch error:', err);
    }
    setLoadingJobs(false);
  };

  const handleSkillChange = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim() || !location.trim()) {
      alert('Please fill in all required fields (Title, Description, Location).');
      return;
    }
    if (selectedSkills.length === 0) {
      alert('Please select at least one required skill.');
      return;
    }

    setPosting(true);
    const jobData = {
      title: jobTitle.trim(),
      description: jobDescription.trim(),
      skills: selectedSkills,
      experienceYears: parseInt(experienceYears) || 0,
      location: location.trim(),
      salary: salary.trim() || null
    };

    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(jobData)
      });
      if (res.ok) {
        alert('Job posted successfully!');
        setJobTitle('');
        setJobDescription('');
        setSelectedSkills([]);
        setExperienceYears(0);
        setLocation('');
        setSalary('');
        fetchEmployerJobs();
        fetchStats();
        setActiveTab('myjobs');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to post job');
      }
    } catch (err) {
      alert('Network error. Failed to post job.');
    }
    setPosting(false);
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job posting?')) return;
    try {
      const res = await fetch(`${API_BASE}/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Job deleted successfully.');
        fetchEmployerJobs();
        fetchStats();
      } else {
        alert('Failed to delete job.');
      }
    } catch (err) {
      alert('Error deleting job.');
    }
  };

  const openApplicationsModal = async (job) => {
    setAppsModal({ open: true, job });
    setLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE}/applications/job/${job.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
    setLoadingApps(false);
  };

  const handleUpdateStatus = async (appId, status) => {
    try {
      const res = await fetch(`${API_BASE}/applications/${appId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(applications.map(app => app.id === appId ? { ...app, status } : app));
        fetchStats();
      } else {
        alert('Failed to update application status.');
      }
    } catch (err) {
      alert('Error updating application status.');
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Header & Stats Card */}
      <div className="dashboard-header-card">
        <h2>Recruiter Dashboard</h2>
        
        <div className="recruiter-stats-grid">
          <div className="recruiter-stat-card">
            <span className="stat-val">{stats.totalJobs || 0}</span>
            <span className="stat-lbl">Jobs Posted</span>
          </div>
          <div className="recruiter-stat-card">
            <span className="stat-val">{stats.totalApplications || 0}</span>
            <span className="stat-lbl">Total Applicants</span>
          </div>
          <div className="recruiter-stat-card warning">
            <span className="stat-val">{stats.pendingApplications || 0}</span>
            <span className="stat-lbl">Pending Review</span>
          </div>
          <div className="recruiter-stat-card success">
            <span className="stat-val">{stats.acceptedApplications || 0}</span>
            <span className="stat-lbl">Shortlisted</span>
          </div>
        </div>

        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab-btn ${activeTab === 'post' ? 'active' : ''}`}
            onClick={() => setActiveTab('post')}
          >
            Post a New Job
          </button>
          <button
            className={`dashboard-tab-btn ${activeTab === 'myjobs' ? 'active' : ''}`}
            onClick={() => setActiveTab('myjobs')}
          >
            My Jobs ({jobs.length})
          </button>
        </div>
      </div>

      {/* Post Job Form Tab */}
      {activeTab === 'post' && (
        <div className="dashboard-content-card">
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ margin: '0 0 0.35rem 0' }}>Post a New Job Listing</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
              Publish your job opening to connect with qualified candidates instantly.
            </p>
          </div>

          <form onSubmit={handlePostJob} className="job-post-container">
            {/* Section 1: Basic Information */}
            <div className="form-sub-card">
              <div className="form-sub-card-title">
                Basic Role Information
              </div>
              
              <div className="form-group">
                <label className="field-label">Job Title <span className="req">*</span></label>
                <input
                  type="text"
                  className="input-styled"
                  placeholder="e.g. Senior Full Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-three-col" style={{ marginTop: '1.25rem' }}>
                <div className="form-group">
                  <label className="field-label">Location <span className="req">*</span></label>
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="e.g. Mumbai, Remote, Hybrid"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="field-label">Experience Required</label>
                  <select className="select-styled" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}>
                    <option value="0">Fresher (0 years)</option>
                    <option value="1">1 Year</option>
                    <option value="2">2 Years</option>
                    <option value="3">3 Years</option>
                    <option value="4">4 Years</option>
                    <option value="5">5+ Years</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="field-label">Salary Package</label>
                  <input
                    type="text"
                    className="input-styled"
                    placeholder="e.g. 8 - 12 LPA"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Role Description */}
            <div className="form-sub-card">
              <div className="form-sub-card-title">
                Role Description & Responsibilities
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="field-label">Detailed Job Description <span className="req">*</span></label>
                <textarea
                  className="textarea-styled"
                  rows="5"
                  placeholder="Describe key responsibilities, team environment, and candidate expectations..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Section 3: Tech Skills */}
            <div className="form-sub-card">
              <div className="form-sub-card-title">
                Required Technical Skills <span className="req">*</span>
              </div>
              
              <div className="skills-pills-wrapper">
                {Array.from(new Set([...SKILL_OPTIONS, ...selectedSkills])).map(skill => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      className={`skill-chip ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSkillChange(skill)}
                    >
                      {isSelected && <span className="check-icon">✓</span>}
                      {skill}
                    </button>
                  );
                })}
              </div>

              <div className="custom-skill-input-row">
                <input
                  type="text"
                  className="input-styled"
                  placeholder="Add custom skill (e.g. Docker, AWS)"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustomSkill(e); }}
                />
                <button type="button" className="btn-add-skill" onClick={handleAddCustomSkill}>
                  + Add
                </button>
              </div>
            </div>

            {/* Publish Action Button */}
            <button type="submit" className="btn-publish-job" disabled={posting}>
              {posting ? 'Publishing Job Listing...' : 'Publish Job Listing'}
            </button>
          </form>
        </div>
      )}

      {/* My Jobs Tab */}
      {activeTab === 'myjobs' && (
        <div className="dashboard-content-card">
          <h3>Manage Job Listings</h3>
          <div className="jobs-table-container">
            <div className="jobs-grid-table">
              <div className="jobs-grid-header">
                <div>Title</div>
                <div>Required Skills</div>
                <div>Experience</div>
                <div>Applicants</div>
                <div>Actions</div>
              </div>
              <div>
                {loadingJobs ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>Loading active job postings...</div>
                ) : jobs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>No jobs posted yet. Click "Post a New Job" to get started!</div>
                ) : (
                  jobs.map(job => (
                    <div className="jobs-grid-row" key={job.id}>
                      <div><strong>{job.title}</strong></div>
                      <div>{Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '-'}</div>
                      <div>{job.experienceYears > 0 ? `${job.experienceYears} yr(s)` : 'Fresher'}</div>
                      <div>
                        <span className="status-badge warning">{job.applicationCount || 0} applied</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-icon"
                          onClick={() => openApplicationsModal(job)}
                        >
                          Applicants ({job.applicationCount || 0})
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {appsModal.open && (
        <div className="modal-overlay" onClick={() => setAppsModal({ open: false, job: null })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setAppsModal({ open: false, job: null })}
            >
              &times;
            </button>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>Applications for {appsModal.job?.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              {applications.length} total applicant(s) for this position
            </p>

            {loadingApps ? (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>Loading candidate applications...</p>
            ) : applications.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem' }}>No candidates have applied for this job yet.</p>
            ) : (
              <div>
                {applications.map(app => (
                  <div key={app.id} className="candidate-app-card">
                    <div className="candidate-header">
                      <div>
                        <h4 className="candidate-name">{app.studentFirstName} {app.studentLastName}</h4>
                        <p className="candidate-meta">
                          Email: <strong>{app.studentEmail}</strong> {app.phone ? `| Phone: ${app.phone}` : ''}
                        </p>
                        {app.college && (
                          <p className="candidate-meta" style={{ marginTop: '0.2rem' }}>
                            College: {app.college} {app.course ? `(${app.course})` : ''}
                          </p>
                        )}
                      </div>
                      <span className={`status-badge ${app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`}>
                        {app.status || 'pending'}
                      </span>
                    </div>

                    {app.coverLetter && (
                      <div style={{ margin: '0.75rem 0', fontSize: '0.9rem', color: '#334155', background: '#ffffff', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                        <strong>Cover Letter / Note:</strong> {app.coverLetter}
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                      {app.resumePath ? (
                        <a
                          href={`${API_BASE.replace('/api', '')}${app.resumePath}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#2563eb', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}
                        >
                          View Candidate Resume
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>No resume file attached</span>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          className="btn-status-accept"
                          onClick={() => handleUpdateStatus(app.id, 'accepted')}
                          disabled={app.status === 'accepted'}
                        >
                          {app.status === 'accepted' ? 'Shortlisted' : 'Accept'}
                        </button>
                        <button
                          className="btn-status-reject"
                          onClick={() => handleUpdateStatus(app.id, 'rejected')}
                          disabled={app.status === 'rejected'}
                        >
                          {app.status === 'rejected' ? 'Rejected' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployerDashboard;
