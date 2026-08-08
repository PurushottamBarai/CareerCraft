import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import '../styles/institute-style.css';

const Institute = () => {
  const { user, token, API_BASE, login, logout } = useContext(AuthContext);

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [activeTab, setActiveTab] = useState('students');
  const [stats, setStats] = useState({ totalStudents: 0, totalEmployers: 0, totalJobs: 0, totalApplications: 0 });
  const [students, setStudents] = useState([]);
  const [employers, setEmployers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = user && user.role === 'admin';

  useEffect(() => {
    if (isAdmin && token) {
      fetchAdminStats();
      fetchAdminData();
    }
  }, [isAdmin, token]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoadingLogin(true);
    const result = await login(adminUsername, adminPassword);
    setLoadingLogin(false);
    if (!result.success) {
      setLoginError(result.message || 'Invalid admin credentials');
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Fetch admin stats error:', err);
    }
  };

  const fetchAdminData = async () => {
    try {
      const [stdRes, empRes, jobRes, appRes] = await Promise.all([
        fetch(`${API_BASE}/admin/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/employers`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/jobs`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/admin/applications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (stdRes.ok) setStudents(await stdRes.json());
      if (empRes.ok) setEmployers(await empRes.json());
      if (jobRes.ok) setJobs(await jobRes.json());
      if (appRes.ok) setApplications(await appRes.json());
    } catch (err) {
      console.error('Fetch admin data error:', err);
    }
  };

  const filteredStudents = students.filter(s =>
    (s.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.college || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredEmployers = employers.filter(e =>
    (e.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredJobs = jobs.filter(j =>
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (j.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredApplications = applications.filter(a =>
    (a.studentFirstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.jobTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (a.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="form-section">
        <div className="form-container" style={{ maxWidth: '420px' }}>
          <h2>Admin Login</h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'center', marginBottom: '1.5rem' }}>
            Placement Cell & Administrator Access
          </p>

          {loginError && (
            <div style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Username</label>
              <input
                type="text"
                placeholder="Enter admin username"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Admin Password</label>
              <input
                type="password"
                placeholder="Enter admin password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loadingLogin}>
              {loadingLogin ? 'Authenticating...' : 'Login to Admin Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1150px', margin: '2.5rem auto', padding: '0 1.5rem' }}>
      {/* Header & Stats */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.65rem' }}>Institute & Placement Dashboard</h2>
            <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>
              Manage students, recruiters, job postings, and placement statistics
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '1.75rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#2563eb', display: 'block' }}>{stats.totalStudents || 0}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Registered Students</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0284c7', display: 'block' }}>{stats.totalEmployers || 0}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Recruiters & Companies</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#16a34a', display: 'block' }}>{stats.totalJobs || 0}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Jobs</span>
          </div>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1.25rem', textAlign: 'center' }}>
            <span style={{ fontSize: '1.85rem', fontWeight: 700, color: '#d97706', display: 'block' }}>{stats.totalApplications || 0}</span>
            <span style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>Applications Filed</span>
          </div>
        </div>

        {/* Tab Switches */}
        <div style={{ display: 'flex', gap: '0.75rem', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.75rem' }}>
          {['students', 'employers', 'jobs', 'applications'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? '#0f172a' : 'transparent',
                color: activeTab === tab ? '#ffffff' : '#64748b',
                border: 'none',
                padding: '0.6rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.95rem',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            className="input-styled"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '0.8rem 1.25rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Student Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>College</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Course</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Graduation</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>No student records found</td></tr>
                ) : (
                  filteredStudents.map(std => (
                    <tr key={std.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem' }}>
                      <td style={{ padding: '1rem' }}>#{std.id}</td>
                      <td style={{ padding: '1rem' }}><strong>{std.firstName} {std.lastName}</strong></td>
                      <td style={{ padding: '1rem' }}>{std.email}</td>
                      <td style={{ padding: '1rem' }}>{std.college || '-'}</td>
                      <td style={{ padding: '1rem' }}>{std.course || '-'}</td>
                      <td style={{ padding: '1rem' }}>{std.graduationYear || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Employers Tab */}
        {activeTab === 'employers' && (
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Contact Name</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Email</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployers.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>No employer records found</td></tr>
                ) : (
                  filteredEmployers.map(emp => (
                    <tr key={emp.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem' }}>
                      <td style={{ padding: '1rem' }}>#{emp.id}</td>
                      <td style={{ padding: '1rem' }}><strong>{emp.firstName} {emp.lastName}</strong></td>
                      <td style={{ padding: '1rem' }}>{emp.companyName || '-'}</td>
                      <td style={{ padding: '1rem' }}>{emp.email}</td>
                      <td style={{ padding: '1rem' }}>{emp.phone || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Jobs Tab */}
        {activeTab === 'jobs' && (
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Job Title</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Location</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Skills Required</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>No job listings found</td></tr>
                ) : (
                  filteredJobs.map(job => (
                    <tr key={job.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem' }}>
                      <td style={{ padding: '1rem' }}>#{job.id}</td>
                      <td style={{ padding: '1rem' }}><strong>{job.title}</strong></td>
                      <td style={{ padding: '1rem' }}>{job.companyName || 'Recruiter'}</td>
                      <td style={{ padding: '1rem' }}>{job.location || '-'}</td>
                      <td style={{ padding: '1rem' }}>{Array.isArray(job.skills) ? job.skills.join(', ') : job.skills || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="table-container" style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#475569', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>ID</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Student Candidate</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Job Title</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Company</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Applied Date</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>No application records found</td></tr>
                ) : (
                  filteredApplications.map(app => (
                    <tr key={app.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.95rem' }}>
                      <td style={{ padding: '1rem' }}>#{app.id}</td>
                      <td style={{ padding: '1rem' }}><strong>{app.studentFirstName} {app.studentLastName}</strong></td>
                      <td style={{ padding: '1rem' }}>{app.jobTitle}</td>
                      <td style={{ padding: '1rem' }}>{app.companyName || '-'}</td>
                      <td style={{ padding: '1rem' }}>{app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`status-badge ${app.status === 'accepted' ? 'success' : app.status === 'rejected' ? 'danger' : 'warning'}`}>
                          {app.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Institute;
