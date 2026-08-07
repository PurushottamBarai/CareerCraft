import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/home-style.css';

const companyLogos = [
  { name: 'Google', src: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' },
  { name: 'Microsoft', src: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg' },
  { name: 'Amazon', src: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg' },
  { name: 'Meta', src: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg' },
  { name: 'Adobe', src: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Adobe_Systems_logo_and_wordmark.svg' },
  { name: 'Salesforce', src: 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Salesforce.com_logo.svg' },
  { name: 'Wipro', src: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg' },
  { name: 'Infosys', src: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg' }
];

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToServices) {
      setTimeout(() => {
        const el = document.getElementById('services');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  return (
    <>
      <section className="hero-banner-section">
        <div className="hero-content">
          <h1>Take charge of <br />your career</h1>
          <p className="hero-subtitle-new">
            Find the right opportunities, build in-demand skills, and advance your professional journey with confidence.
          </p>
          <div className="hero-search-bar">
            <div className="search-input-group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder="Job title or keywords" className="search-input" />
            </div>
            <div className="search-divider"></div>
            <div className="search-input-group">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <input type="text" placeholder="Location" className="search-input" />
            </div>
            <button className="hero-search-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </div>
        </div>
      </section>

      <section className="features-section" id="services" style={{ scrollMarginTop: '90px' }}>
        <div className="section-header">
          <h2>Explore Our Services</h2>
          <p>Comprehensive tools and resources designed to accelerate your professional journey.</p>
        </div>
        <div className="feature-grid">
          <Link to="/roadmaps" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Prepare for a Job Role</h3>
            <p>Step-by-step role preparation, interactive guides, and skill roadmaps.</p>
            <span className="card-action-link">Explore Guide &rarr;</span>
          </Link>

          <Link to="/resume" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Generate Resume</h3>
            <p>AI-powered resume builder to create industry-ready professional resumes.</p>
            <span className="card-action-link">Build Resume &rarr;</span>
          </Link>

          <Link to="/roadmaps" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Developer Roadmaps</h3>
            <p>Industry-standard, interactive developer roadmaps designed to guide you.</p>
            <span className="card-action-link">View Roadmaps &rarr;</span>
          </Link>

          <Link to="/quiz" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Take Skill Quiz</h3>
            <p>Test your technical knowledge with interactive skill assessments & quizzes.</p>
            <span className="card-action-link">Start Quiz &rarr;</span>
          </Link>

          <Link to="/hackathons" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Contests & Hackathons</h3>
            <p>Compete in developer hackathons and coding challenges to show off your build.</p>
            <span className="card-action-link">Explore Hackathons &rarr;</span>
          </Link>

          <Link to="/internships" className="feature-card" style={{ textDecoration: 'none' }}>
            <h3>Find Internships</h3>
            <p>Discover handpicked internship opportunities from top companies worldwide.</p>
            <span className="card-action-link">Browse Internships &rarr;</span>
          </Link>
        </div>
      </section>

      <div className="trusted-companies">
        <p className="trusted-label">Trusted by</p>
        <div className="carousel-container">
          <div className="carousel-track">
            {[...companyLogos, ...companyLogos].map((logo, index) => (
              <div key={index} className="carousel-logo">
                <img src={logo.src} alt={logo.name} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
