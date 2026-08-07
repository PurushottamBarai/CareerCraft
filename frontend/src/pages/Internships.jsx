import React from 'react';
import '../styles/styles.css';
import '../styles/internships.css';

const Internships = () => {
  return (
    <div className="internships-wrapper">
      <div className="int-header">
        <h2>Find Internships</h2>
        <p>Your gateway to launching your career. Explore top internship platforms dedicated to students and entry-level professionals globally.</p>
      </div>

      <div className="int-platform-grid">
        <a href="https://internshala.com/" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>Internshala</h3>
          <p>The largest internship platform in India. Find paid internships across all fields including engineering, design, and management.</p>
          <span className="int-p-link">Browse Internships &rarr;</span>
        </a>

        <a href="https://wellfound.com/jobs" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>Wellfound (AngelList)</h3>
          <p>Connect directly with founders at top startups. Discover remote computer science and SWE internships.</p>
          <span className="int-p-link">View Startup Jobs &rarr;</span>
        </a>

        <a href="https://www.linkedin.com/jobs/internship-jobs" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>LinkedIn</h3>
          <p>The world's largest professional network. Leverage your connections and search globally for Fortune 500 internship programs.</p>
          <span className="int-p-link">Search on LinkedIn &rarr;</span>
        </a>

        <a href="https://www.ycombinator.com/jobs" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>Y Combinator</h3>
          <p>Work for the next unicorn. Find exclusive internships at YC-backed startups like Airbnb, Stripe, and Reddit in their early days.</p>
          <span className="int-p-link">Find YC Internships &rarr;</span>
        </a>

        <a href="https://simplify.jobs/" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>Simplify</h3>
          <p>The common app for tech jobs. Apply to thousands of SWE internships globally with a single click using their autofill infrastructure.</p>
          <span className="int-p-link">Auto-Apply to Jobs &rarr;</span>
        </a>

        <a href="https://www.glassdoor.com/Job/internship-jobs" target="_blank" rel="noopener noreferrer" className="int-platform-card">
          <h3>Glassdoor</h3>
          <p>Look beyond the job description. Read legitimate company reviews from past interns before you apply to their programs.</p>
          <span className="int-p-link">View Salaries & Jobs &rarr;</span>
        </a>
      </div>
    </div>
  );
};

export default Internships;
