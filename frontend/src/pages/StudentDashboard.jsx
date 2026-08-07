import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/student-dashboard.css';

const StudentDashboard = () => {
  const { token, API_BASE } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('browse');
  const [stats, setStats] = useState({ totalApplications: 0, pending: 0, accepted: 0, rejected: 0 });
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [applyModal, setApplyModal] = useState({ open: false, job: null });
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchJobs();
    fetchApplications();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/stats/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Stats fetch error:', err);
    }
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_BASE}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Jobs fetch error:', err);
    }
  };

  const fetchApplications = async () => {
    try {
      const res = await fetch(`${API_BASE}/applications/student`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setApplications(data);
      }
    } catch (err) {
      console.error('Applications fetch error:', err);
    }
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!resumeFile) return alert('Please upload your resume file (PDF or DOCX)');
    setSubmitting(true);
    const formData = new FormData();
    formData.append('jobId', applyModal.job.id);
    formData.append('resume', resumeFile);
    formData.append('coverLetter', coverLetter);
    try {
      const res = await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        alert('Application submitted successfully!');
        setApplyModal({ open: false, job: null });
        setCoverLetter('');
        setResumeFile(null);
        fetchApplications();
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.message || 'Application failed');
      }
    } catch (err) {
      alert('Failed to submit application');
    }
    setSubmitting(false);
  };

  const filteredJobs = jobs.filter(job =>
    (job.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.skills || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.companyName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusClass = (status) => {
    switch (status) {
      case 'accepted': return 'success';
      case 'rejected': return 'danger';
      default: return 'warning';
    }
  };

  return (
    <div className="student-dashboard-wrapper">
      {/* Header & Stats Card */}
      <div className="student-header-card">
        <h2>Student Dashboard</h2>

        <div className="student-stats-grid">
          <div className="student-stat-card">
            <span className="stat-val">{stats.totalApplications || 0}</span>
            <span className="stat-lbl">Total Applications</span>
          </div>
          <div className="student-stat-card success">
            <span className="stat-val">{stats.accepted || 0}</span>
            <span className="stat-lbl">Shortlisted</span>
          </div>
          <div className="student-stat-card warning">
            <span className="stat-val">{stats.pending || 0}</span>
            <span className="stat-lbl">Under Review</span>
          </div>
          <div className="student-stat-card danger">
            <span className="stat-val">{stats.rejected || 0}</span>
            <span className="stat-lbl">Declined</span>
          </div>
        </div>

        <div className="student-tabs">
          <button
            className={`student-tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => setActiveTab('browse')}
          >
            Browse Jobs
          </button>
          <button
            className={`student-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('applications')}
          >
            My Applications ({applications.length})
          </button>
        </div>
      </div>

      {/* Browse Jobs Tab */}
      {activeTab === 'browse' && (
        <div className="student-content-card">
          <h3>Explore Active Job Opportunities</h3>

          <div className="student-search-box">
            <input
              type="text"
              className="student-search-input"
              placeholder="Search jobs by title, company, or tech skills (e.g. React, Node)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="student-table-container">
            <div className="student-grid-table">
              <div className="student-grid-header">
                <div>Role Title</div>
                <div>Company</div>
                <div>Skills Required</div>
                <div>Experience</div>
                <div>Action</div>
              </div>
              <div>
                {filteredJobs.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    No matching job opportunities found.
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <div className="student-grid-row" key={job.id}>
                      <div><strong>{job.title}</strong></div>
                      <div>{job.companyName || 'Corporate Partner'}</div>
                      <div>{Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '-'}</div>
                      <div>{job.experienceYears ? `${job.experienceYears} yr(s)` : 'Fresher'}</div>
                      <div>
                        <button
                          className="btn-apply-job"
                          onClick={() => setApplyModal({ open: true, job })}
                        >
                          Apply Now
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

      {/* My Applications Tab */}
      {activeTab === 'applications' && (
        <div className="student-content-card">
          <h3>Track Your Applications</h3>

          <div className="student-table-container">
            <div className="student-grid-table">
              <div className="apps-grid-header">
                <div>Applied Position</div>
                <div>Company Name</div>
                <div>Applied Date</div>
                <div>Status</div>
              </div>
              <div>
                {applications.length === 0 ? (
                  <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                    You haven't submitted any job applications yet. Click "Browse Jobs" to start applying!
                  </div>
                ) : (
                  applications.map(app => (
                    <div className="apps-grid-row" key={app.id}>
                      <div><strong>{app.jobTitle || app.title || 'Job Opportunity'}</strong></div>
                      <div>{app.companyName || 'Recruiter'}</div>
                      <div>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '-'}</div>
                      <div>
                        <span className={`status-badge ${getStatusClass(app.status)}`}>
                          {app.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Submission Modal */}
      {applyModal.open && (
        <div className="modal-overlay" onClick={() => setApplyModal({ open: false, job: null })}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close-btn"
              onClick={() => setApplyModal({ open: false, job: null })}
            >
              &times;
            </button>
            <h3 style={{ margin: '0 0 0.25rem 0', color: '#0f172a' }}>Apply for {applyModal.job?.title}</h3>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Company: <strong>{applyModal.job?.companyName || 'Recruiter'}</strong>
            </p>

            <form onSubmit={handleApply}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="field-label">Upload Resume File <span className="req">*</span></label>
                <input
                  type="file"
                  className="input-styled"
                  accept=".pdf,.doc,.docx"
                  required
                  onChange={(e) => setResumeFile(e.target.files[0])}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem', display: 'block' }}>
                  Supported formats: PDF, DOCX
                </span>
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="field-label">Cover Letter / Note for Recruiter</label>
                <textarea
                  className="textarea-styled"
                  rows="4"
                  placeholder="Introduce yourself and explain why you're a great fit for this position..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-publish-job" disabled={submitting}>
                {submitting ? 'Submitting Application...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
