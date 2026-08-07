import React from 'react';
import '../styles/styles.css';
import '../styles/hackathons.css';

const Hackathons = () => {
  return (
    <div className="hackathons-wrapper">
      <div className="hk-header">
        <h2>Contests & Hackathons</h2>
        <p>Explore top-tier platforms to compete, build projects, verify your skills, and earn global recognition. Pick an ecosystem to dive in!</p>
      </div>

      <div className="hk-platform-grid">
        <a href="https://devpost.com/hackathons" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>Devpost</h3>
          <p>The global standard for hackathons. Build software, compete for massive prizes, and grow your portfolio.</p>
          <span className="hk-p-link">Explore Hackathons &rarr;</span>
        </a>

        <a href="https://mlh.io/seasons/2026/events" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>Major League Hacking</h3>
          <p>The official student hackathon league. Find beginner-friendly student hackathons running every weekend.</p>
          <span className="hk-p-link">View MLH Season &rarr;</span>
        </a>

        <a href="https://www.kaggle.com/competitions" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>Kaggle</h3>
          <p>The home of Data Science and Machine Learning. Solve real-world AI challenges and climb the global ranks.</p>
          <span className="hk-p-link">Discover Competitions &rarr;</span>
        </a>

        <a href="https://leetcode.com/contest/" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>LeetCode Contests</h3>
          <p>Weekly and bi-weekly algorithmic programming assessments to sharpen your core Data Structures and Algorithms.</p>
          <span className="hk-p-link">Join Weekly Contest &rarr;</span>
        </a>

        <a href="https://codeforces.com/contests" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>Codeforces</h3>
          <p>High-level competitive programming. Participate in lightning-fast algorithmic rounds against international developers.</p>
          <span className="hk-p-link">View Schedule &rarr;</span>
        </a>

        <a href="https://www.hackerrank.com/contests" target="_blank" rel="noopener noreferrer" className="hk-platform-card">
          <h3>HackerRank</h3>
          <p>Industry-sponsored hacking competitions and corporate hiring challenges. Show off your skills to top employers.</p>
          <span className="hk-p-link">Find Hiring Challenges &rarr;</span>
        </a>
      </div>
    </div>
  );
};

export default Hackathons;
