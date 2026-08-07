import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import '../styles/about.css';

const About = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.scrollToAbout) {
      setTimeout(() => {
        const el = document.getElementById('about');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  return (
    <div className="about-page-wrapper" id="about" style={{ scrollMarginTop: '90px' }}>
      <div className="about-header">
        <h1>About CareerCraft</h1>
        <p>
          CareerCraft is a comprehensive career platform designed to help students, job seekers, and recruiters connect and grow efficiently.
        </p>
      </div>

      <div className="about-section">
        <h2>Our Mission</h2>
        <p>
          Our mission is to simplify career development by providing accessible, intelligent tools. From automated ATS-friendly resume generation to interactive skill quizzes and role-specific roadmaps, we empower individuals to achieve their professional goals.
        </p>
      </div>

      <div className="about-section">
        <h2>What We Offer</h2>
        <div className="about-grid">
          <div className="about-card">
            <h3>AI Resume Builder</h3>
            <p>Create professional, ATS-optimized resumes with inline AI content enhancement and instant Word document generation.</p>
          </div>
          <div className="about-card">
            <h3>Skill Assessments</h3>
            <p>Evaluate your technical expertise with subject-specific quizzes and real-time score breakdowns.</p>
          </div>
          <div className="about-card">
            <h3>Career Roadmaps</h3>
            <p>Follow structured learning guides tailored for modern technology careers and engineering roles.</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;