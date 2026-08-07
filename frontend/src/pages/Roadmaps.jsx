import React from 'react';
import '../styles/styles.css';
import '../styles/roadmaps.css';

const Roadmaps = () => {
  return (
    <div className="roadmaps-wrapper">
      <div id="roadmapSelectionHub">
        <div className="rm-hub-header">
          <h2>Career Learning Roadmaps</h2>
          <p>Industry-standard, interactive developer roadmaps designed to guide you. (Powered by roadmap.sh)</p>
        </div>
        <div className="rm-grid">
          <a href="https://roadmap.sh/frontend" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>Frontend</h3>
            <p>Step-by-step guide to becoming a modern frontend developer.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
          <a href="https://roadmap.sh/backend" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>Backend</h3>
            <p>Learn server-side programming, databases, APIs, and scaling.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
          <a href="https://roadmap.sh/devops" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>DevOps</h3>
            <p>Master CI/CD, containerization, infrastructure, and cloud deployment.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
          <a href="https://roadmap.sh/full-stack" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>Full Stack</h3>
            <p>End-to-end roadmap covering both frontend and backend concepts.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
          <a href="https://roadmap.sh/ai-data-scientist" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>AI & Data Science</h3>
            <p>Deep dive into machine learning, data engineering, and AI ops.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
          <a href="https://roadmap.sh/system-design" target="_blank" rel="noopener noreferrer" className="rm-card" style={{ textDecoration: 'none' }}>
            <h3>System Design</h3>
            <p>How to design scalable, highly available distributed systems.</p>
            <span className="rm-link">View Roadmap &rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Roadmaps;
