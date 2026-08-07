import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/register.css';

const Register = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const typeParam = queryParams.get('type');

  const [role, setRole] = useState(typeParam === 'recruiter' || typeParam === 'employer' ? 'employer' : 'student');

  useEffect(() => {
    if (typeParam === 'recruiter' || typeParam === 'employer') {
      setRole('employer');
    } else if (typeParam === 'student') {
      setRole('student');
    }
  }, [typeParam]);

  const [formData, setFormData] = useState({
    firstName: '',
    companyName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { registerUser } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const validateForm = () => {
    const name = role === 'student' ? formData.firstName.trim() : formData.companyName.trim();
    if (!name || name.length < 2) {
      return role === 'student' 
        ? "Please enter your full name (at least 2 characters)." 
        : "Please enter a valid company name (at least 2 characters).";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailRegex.test(formData.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!formData.password || formData.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      email: formData.email.trim(),
      role,
      firstName: role === 'student' ? formData.firstName.trim() : formData.companyName.trim(),
      companyName: role === 'employer' ? formData.companyName.trim() : ''
    };

    const result = await registerUser(payload);
    setLoading(false);
    if (result.success) {
      navigate(`/verify-otp?email=${encodeURIComponent(result.email || payload.email)}`);
    } else {
      setError(result.message || "Registration failed. Please try again.");
    }
  };

  return (
    <div className="form-section">
      <div className="form-container">
        {error && (
          <div className="error-msg" style={{ color: '#ef4444', backgroundColor: '#fef2f2', border: '1px solid #fecaca', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}
        {role === 'employer' ? (
          <>
            <h2>Register as Recruiter</h2>
            <form id="employerRegisterForm" onSubmit={handleRegister}>
              <input type="text" name="companyName" placeholder="Company Name" required value={formData.companyName} onChange={handleChange} />
              <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
              <input type="password" name="password" placeholder="Password (min. 6 characters)" required value={formData.password} onChange={handleChange} />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} />
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            <p>Already have an account? <Link to="/login" className="login-link">Login instead</Link></p>
          </>
        ) : (
          <>
            <h2>Register as Student</h2>
            <form id="studentRegisterForm" onSubmit={handleRegister}>
              <input type="text" name="firstName" placeholder="Full Name" required value={formData.firstName} onChange={handleChange} />
              <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} />
              <input type="password" name="password" placeholder="Password (min. 6 characters)" required value={formData.password} onChange={handleChange} />
              <input type="password" name="confirmPassword" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={handleChange} />
              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
              </button>
            </form>
            <p>Already have an account? <Link to="/login" className="login-link">Login instead</Link></p>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;