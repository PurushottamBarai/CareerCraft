import React, { useState, useContext } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/verify-otp.css';

const VerifyOtp = () => {
  const location = useLocation();
  const { verifyOtp, resendOtp } = useContext(AuthContext);

  const email = new URLSearchParams(location.search).get('email') || '';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resendMsg, setResendMsg] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (otp.length !== 5) {
      setErrorMsg('Please enter the 5-digit OTP.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    const result = await verifyOtp(email, otp);
    setLoading(false);
    if (result.success) {
      setVerified(true);
    } else {
      setErrorMsg(result.message || 'Verification failed. Please try again.');
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setResending(true);
    setResendMsg('');
    setErrorMsg('');
    const result = await resendOtp(email);
    setResending(false);
    if (result.success) {
      setResendMsg('A new OTP has been sent to your email.');
    } else {
      setErrorMsg(result.message || 'Failed to resend OTP.');
    }
  };

  if (verified) {
    return (
      <div className="form-section">
        <div className="form-container" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}></div>
          <h2 style={{ marginBottom: '1rem' }}>Email Verified!</h2>
          <p style={{ color: '#475569', marginBottom: '2rem', fontSize: '0.95rem' }}>
            Your email has been verified successfully.<br/>You can now log in to your account.
          </p>
          <Link to="/login" className="submit-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
            Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="form-section">
      <div className="form-container">
        <h2>Verify Your Email</h2>
        <p style={{ textAlign: 'center', color: '#475569', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          We sent a 5-digit code to<br />
          <strong style={{ color: '#0f172a' }}>{email}</strong>
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength="5"
            placeholder=" X X X X X"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            required
            style={{ textAlign: 'center', fontSize: '1rem', fontWeight: 700 }}
          />
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        {errorMsg && (
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#dc2626', fontWeight: 500, fontSize: '0.9rem' }}>
            {errorMsg}
          </p>
        )}

        {resendMsg && (
          <p style={{ textAlign: 'center', marginTop: '1rem', color: '#16a34a', fontWeight: 500, fontSize: '0.9rem' }}>
            {resendMsg}
          </p>
        )}

        <p style={{ textAlign: 'center', marginTop: '1.5rem', color: '#64748b', fontSize: '0.9rem' }}>
          Didn't receive the code?{' '}
          <a href="#" className="login-link" onClick={handleResend} style={{ fontWeight: 600 }}>
            {resending ? 'Sending...' : 'Resend OTP'}
          </a>
        </p>

        <p style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          <Link to="/login" className="login-link">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
