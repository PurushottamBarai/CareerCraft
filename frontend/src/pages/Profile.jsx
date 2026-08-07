import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/profile.css';

const Profile = () => {
  const { token, API_BASE, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          address: data.address || '',
          companyName: data.companyName || '',
          college: data.college || '',
          course: data.course || '',
          graduationYear: data.graduationYear || ''
        });
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Profile updated successfully!');
        setEditing(false);
        fetchProfile();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Failed to update profile');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Account deleted successfully.');
        logout();
        navigate('/');
      }
    } catch (err) {
      alert('Failed to delete account');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (!profile) {
    return (
      <div className="profile-page-container">
        <div className="profile-card" style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
          Loading user profile...
        </div>
      </div>
    );
  }

  const initial = profile.firstName ? profile.firstName[0].toUpperCase() : 'U';

  return (
    <div className="profile-page-container">
      <div className="profile-card">
        {!editing ? (
          /* View Mode */
          <div>
            <div className="profile-top-header">
              <div className="profile-avatar-row">
                <div className="profile-avatar-circle">
                  {initial}
                </div>
                <div className="profile-user-info">
                  <h2>{profile.firstName} {profile.lastName}</h2>
                  <span className={`user-role-badge ${profile.role || 'student'}`}>
                    {profile.role || 'student'}
                  </span>
                </div>
              </div>

              <button className="btn-edit-profile" onClick={() => setEditing(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </button>
            </div>

            {/* Section 1: Personal Details */}
            <div className="profile-section-card">
              <div className="profile-section-title">Personal Details</div>
              <div className="profile-info-grid">
                <div className="profile-info-tile">
                  <span className="lbl">Full Name</span>
                  <span className="val">{profile.firstName} {profile.lastName || '-'}</span>
                </div>
                <div className="profile-info-tile">
                  <span className="lbl">Email Address</span>
                  <span className="val">{profile.email}</span>
                </div>
                <div className="profile-info-tile">
                  <span className="lbl">Phone Number</span>
                  <span className="val">{profile.phone || 'Not provided'}</span>
                </div>
                <div className="profile-info-tile">
                  <span className="lbl">Location / Address</span>
                  <span className="val">{profile.address || 'Not provided'}</span>
                </div>
                <div className="profile-info-tile">
                  <span className="lbl">Member Since</span>
                  <span className="val">{profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>

            {/* Section 2: Career / Academic Information */}
            {(profile.role === 'student' || profile.role === 'employer') && (
              <div className="profile-section-card">
                <div className="profile-section-title">
                  {profile.role === 'employer' ? 'Company Details' : 'Academic Profile'}
                </div>
                <div className="profile-info-grid">
                  {profile.role === 'employer' && (
                    <div className="profile-info-tile">
                      <span className="lbl">Company Name</span>
                      <span className="val">{profile.companyName || 'Not provided'}</span>
                    </div>
                  )}
                  {profile.role === 'student' && (
                    <>
                      <div className="profile-info-tile">
                        <span className="lbl">College / University</span>
                        <span className="val">{profile.college || 'Not provided'}</span>
                      </div>
                      <div className="profile-info-tile">
                        <span className="lbl">Course / Degree</span>
                        <span className="val">{profile.course || 'Not provided'}</span>
                      </div>
                      <div className="profile-info-tile">
                        <span className="lbl">Graduation Year</span>
                        <span className="val">{profile.graduationYear || 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="profile-actions-row">
              <button className="btn-cancel-profile" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
              </button>
              <button className="danger-btn" onClick={handleDelete}>
                Delete Account
              </button>
            </div>
          </div>
        ) : (
          /* Edit Mode */
          <div>
            <div className="profile-top-header" style={{ marginBottom: '1.5rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Edit User Profile</h2>
                <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                  Update your account information below
                </p>
              </div>
            </div>

            <form onSubmit={handleSave}>
              <div className="profile-section-card">
                <div className="profile-section-title">Personal Details</div>
                <div className="profile-edit-grid">
                  <div className="form-group">
                    <label className="field-label">First Name *</label>
                    <input
                      type="text"
                      className="input-styled"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Last Name</label>
                    <input
                      type="text"
                      className="input-styled"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Phone Number</label>
                    <input
                      type="tel"
                      className="input-styled"
                      name="phone"
                      placeholder="e.g. +91 9876543210"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label className="field-label">Location / Address</label>
                    <input
                      type="text"
                      className="input-styled"
                      name="address"
                      placeholder="e.g. Mumbai, India"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              {/* Role Specific Edit Section */}
              {profile.role === 'employer' && (
                <div className="profile-section-card">
                  <div className="profile-section-title">Company Information</div>
                  <div className="form-group">
                    <label className="field-label">Company Name</label>
                    <input
                      type="text"
                      className="input-styled"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {profile.role === 'student' && (
                <div className="profile-section-card">
                  <div className="profile-section-title">Academic Details</div>
                  <div className="profile-edit-grid">
                    <div className="form-group">
                      <label className="field-label">College / University</label>
                      <input
                        type="text"
                        className="input-styled"
                        name="college"
                        placeholder="e.g. St. Xavier's College"
                        value={formData.college}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="field-label">Course / Degree</label>
                      <input
                        type="text"
                        className="input-styled"
                        name="course"
                        placeholder="e.g. BCA, B.Tech CS"
                        value={formData.course}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label className="field-label">Graduation Year</label>
                      <input
                        type="number"
                        className="input-styled"
                        name="graduationYear"
                        placeholder="e.g. 2026"
                        value={formData.graduationYear}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-actions-row">
                <button type="button" className="btn-cancel-profile" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save-profile" disabled={saving}>
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
