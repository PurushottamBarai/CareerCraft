import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API_BASE = (() => {
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:5000/api`;
  }
  return "/api";
})();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch(e) {}
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        return { success: true, user: data.user };
      } else if (res.status === 403 && data.unverified) {
        return { success: false, unverified: true, email: data.email, message: data.message };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch(err) {
      return { success: false, message: 'Server error' };
    }
  };

  const registerUser = async (data) => {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      if (res.ok && result.verificationToken) {
        sessionStorage.setItem('verificationToken', result.verificationToken);
      }
      return res.ok ? { success: true, email: result.email } : { success: false, message: result.message || 'Registration failed' };
    } catch(err) {
      return { success: false, message: 'Server error' };
    }
  };

  const registerEmployer = (data) => registerUser({ ...data, role: 'employer' });

  const verifyOtp = async (email, otp) => {
    try {
      const verificationToken = sessionStorage.getItem('verificationToken');
      const res = await fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, verificationToken })
      });
      const result = await res.json();
      if (res.ok) {
        sessionStorage.removeItem('verificationToken');
      }
      return res.ok ? { success: true, message: result.message } : { success: false, message: result.message };
    } catch(err) {
      return { success: false, message: 'Server error' };
    }
  };

  const resendOtp = async (email) => {
    try {
      const verificationToken = sessionStorage.getItem('verificationToken');
      const res = await fetch(`${API_BASE}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, verificationToken })
      });
      const result = await res.json();
      if (res.ok && result.verificationToken) {
        sessionStorage.setItem('verificationToken', result.verificationToken);
      }
      return res.ok ? { success: true } : { success: false, message: result.message };
    } catch(err) {
      return { success: false, message: 'Server error' };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, registerUser, registerEmployer, verifyOtp, resendOtp, API_BASE }}>
      {children}
    </AuthContext.Provider>
  );
};
