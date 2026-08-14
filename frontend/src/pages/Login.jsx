import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      if (result.user.role === 'admin') navigate('/institute');
      else if (result.user.role === 'employer') navigate('/employerdashboard');
      else navigate('/dashboard');
    } else if (result.unverified) {
      navigate(`/verify-otp?email=${encodeURIComponent(result.email)}`);
    } else {
      alert(result.message || 'Invalid credentials');
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>
      <div className="login-box">
        <h2 className="login-title">Login</h2>
        <form className="minimal-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="login-email">Email ID / Username</label>
            <input 
              type="text" 
              id="login-email" 
              placeholder="Enter Email ID / Username" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="input-group password-group">
            <label htmlFor="login-password">Password</label>
            <div className="password-wrapper">
              <input 
                type="password" 
                id="login-password" 
                placeholder="Enter Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="submit-btn primary-solid" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', color: '#64748b', fontSize: '0.92rem' }}>
          Don't have an account? <Link to="/register" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none' }}>Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
