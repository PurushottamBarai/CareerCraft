import React, { useContext, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import '../styles/navbar.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [registerDropdownOpen, setRegisterDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleServicesClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      const el = document.getElementById('services');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollToServices: true } });
    }
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === '/about') {
      const el = document.getElementById('about');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/about', { state: { scrollToAbout: true } });
    }
  };

  return (
    <nav className="navbar" onClick={() => setRegisterDropdownOpen(false)}>
      <div className="nav-container">
        <Link to="/">
          <img className="logo" src="/assets/logo.png" alt="carreercraft" style={{ cursor: 'pointer' }} />
        </Link>
        <button 
          id="hamburger-btn" 
          className={`hamburger ${mobileMenuOpen ? 'active' : ''}`} 
          aria-label="Toggle Menu"
          onClick={(e) => {
            e.stopPropagation();
            setMobileMenuOpen(!mobileMenuOpen);
          }}
        >
          <span className="ham-line"></span>
          <span className="ham-line"></span>
          <span className="ham-line"></span>
        </button>
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`} id="nav-links">
          <div className="anc">
            <a href="/about" onClick={handleAboutClick} className="nav-hover-link" style={{ textDecoration: 'none', color: 'inherit' }}>About Us</a>
            <a href="#services" onClick={handleServicesClick} className="nav-hover-link" style={{ textDecoration: 'none', color: 'inherit' }}>Services</a>
          </div>

          {!user ? (
            <div id="guestNavLinks" className="btn" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <Link to="/login" className="nav-btn login" onClick={() => setMobileMenuOpen(false)} style={{textDecoration: 'none'}}>Sign In</Link>
              <div className="register-menu" style={{ position: 'relative' }}>
                <button 
                  type="button"
                  className="nav-btn register" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setRegisterDropdownOpen(!registerDropdownOpen);
                  }}
                >
                  Get Started
                </button>
                {registerDropdownOpen && (
                  <div className="register-dropdown">
                    <Link 
                      to="/register?type=student" 
                      onClick={() => { setRegisterDropdownOpen(false); setMobileMenuOpen(false); }}
                    >
                      Student
                    </Link>
                    <Link 
                      to="/register?type=recruiter" 
                      onClick={() => { setRegisterDropdownOpen(false); setMobileMenuOpen(false); }}
                    >
                      Recruiter
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div id="userNavLinks" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="welcome-text">Hi, {user.firstName || 'User'}</span>
              <div className="profile-menu hover-menu-container">
                <button className="profile-btn nav-hover-link" style={{ background: '#f1f5f9', border: 'none', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>
                  <span>{user.firstName?.charAt(0) || 'U'}</span>
                </button>
                <div className="hover-dropdown" style={{ right: 0, left: 'auto', minWidth: '150px' }}>
                  <div className="dropdown-col">
                    <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                    <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                    <hr />
                    <a href="#!" onClick={(e) => { setMobileMenuOpen(false); handleLogout(); }}>Logout</a>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
