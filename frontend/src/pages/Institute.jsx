import React, { useEffect } from 'react';
import '../styles/styles.css';
import '../styles/institute-style.css';

const Institute = () => {
  useEffect(() => {}, []);

  return (
    <>
      
    <nav className="navbar">
        <div className="nav-container">
            <img className="logo" src="/assets/logo.png" alt="CareerCraft" />
            <div className="nav-links">
                <span className="admin-title">Admin</span>
                <button className="logout-btn" >Logout</button>
            </div>
        </div>
    </nav>

    
    <div id="loginSection" className="login-container hidden">
        <div className="login-box minimal-form">
            <h2 className="login-title">Admin Login</h2>
            <form id="adminLoginForm">
                <div className="input-group">
                    <label htmlFor="admin-username">Username / Email ID</label>
                    <input type="text" id="admin-username" name="email" placeholder="Enter Admin Username" required />
                </div>
                <div className="input-group password-group">
                    <label htmlFor="admin-password">Password</label>
                    <div className="password-wrapper">
                        <input type="password" id="admin-password" name="password" placeholder="Enter Password" required />
                        
                        <button type="button" className="toggle-password" >Show</button>
                    </div>
                </div>
                <button type="submit" className="submit-btn primary-solid" id="adminLoginBtn">Login</button>
            </form>
            <div className="login-alternatives" style={{}}>
               <a href="../index.html" className="otp-link">Return to Main Site</a>
            </div>
        </div>
    </div>

    <div id="adminPanel" className="container hidden">
        <div className="dashboard-header">
            <h1>Institute Dashboard</h1>
            <div className="stats-overview">
                <div className="stat-box">
                    <span className="stat-number" id="totalStudents">0</span>
                    <span className="stat-label">Total Students</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number" id="totalEmployers">0</span>
                    <span className="stat-label">Total Employers</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number" id="totalJobs">0</span>
                    <span className="stat-label">Total Jobs</span>
                </div>
                <div className="stat-box">
                    <span className="stat-number" id="totalApplications">0</span>
                    <span className="stat-label">Total Applications</span>
                </div>
            </div>
        </div>

        <div className="tabs">
            <button className="tab-btn active" >Students</button>
            <button className="tab-btn" >Employers</button>
            <button className="tab-btn" >Jobs</button>
            <button className="tab-btn" >Applications</button>
            <button className="tab-btn" >Messages</button>
        </div>

        <div id="studentsTab" className="tab-content">
            <h2>Registered Students</h2>
            <div className="search-box">
                <input type="text" id="studentSearch" placeholder="Search students by name, email, college..."  />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>College</th>
                            <th>Course</th>
                            <th>Graduation Year</th>
                            <th>Phone</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <div id="employersTab" className="tab-content hidden">
            <h2>Registered Employers</h2>
            <div className="search-box">
                <input type="text" id="employerSearch" placeholder="Search employers by name, email, company..."  />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Company</th>
                            <th>Phone</th>
                            <th>Jobs Posted</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="employersTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <div id="jobsTab" className="tab-content hidden">
            <h2>All Jobs</h2>
            <div className="search-box">
                <input type="text" id="jobSearch" placeholder="Search jobs by title, company, skills..."  />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Title</th>
                            <th>Company</th>
                            <th>Location</th>
                            <th>Skills</th>
                            <th>Experience</th>
                            <th>Applications</th>
                            <th>Posted</th>
                        </tr>
                    </thead>
                    <tbody id="jobsTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <div id="applicationsTab" className="tab-content hidden">
            <h2>All Applications</h2>
            <div className="search-box">
                <input type="text" id="applicationSearch" placeholder="Search applications..."  />
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student</th>
                            <th>Job Title</th>
                            <th>Company</th>
                            <th>Applied Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="applicationsTableBody">
                    </tbody>
                </table>
            </div>
        </div>

        <div id="messagesTab" className="tab-content hidden">
            <h2>Messages & Notifications</h2>
            <div className="messages-container">
                <div className="message-filters">
                    <button className="filter-btn active" >All</button>
                    <button className="filter-btn" >From Students</button>
                    <button className="filter-btn" >From Employers</button>
                </div>
                <div id="messagesContent">
                    <p className="info-text">No messages available. This section will display contact messages from students and employers.</p>
                </div>
            </div>
        </div>
    </div>

    <div id="userDetailModal" className="modal hidden">
        <div className="modal-content">
            <span className="close-btn" >&times;</span>
            <h2 id="modalTitle">User Details</h2>
            <div id="modalBody"></div>
        </div>
    </div>

    

    </>
  );
};

export default Institute;
