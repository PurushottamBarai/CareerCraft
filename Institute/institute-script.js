// API Configuration
const API_BASE = (() => {
    const hostname = window.location.hostname;
    const port = window.location.port;
    const protocol = window.location.protocol;
    
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:5000/api`;
    }
    return '/api';
})();

let adminToken = null;
let allStudents = [];
let allEmployers = [];
let allJobs = [];
let allApplications = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    checkAdminAuth();
});

function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('Checking auth, token exists:', !!token);
    console.log('User data:', user);
    
    if (token && user) {
        try {
            const userData = JSON.parse(user);
            console.log('Parsed user role:', userData.role);
            
            if (userData.role === 'admin') {
                adminToken = token;
                showAdminPanel();
                return;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
    
    // Not logged in as admin, redirect to main login
    alert('Please login as admin first');
    window.location.href = '../index.html';
}

function showAdminPanel() {
    console.log('Showing admin panel...');
    const loadingSection = document.getElementById('loadingSection');
    const adminPanel = document.getElementById('adminPanel');
    
    if (loadingSection) loadingSection.classList.add('hidden');
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        loadAllData();
    } else {
        console.error('adminPanel element not found!');
    }
}


// Admin Login
function checkAdminAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
        const userData = JSON.parse(user);
        if (userData.role === 'admin') {
            adminToken = token;
            showAdminPanel();
            return;
        }
    }
    
    // Not logged in as admin, redirect to main login
    window.location.href = '../index.html';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    adminToken = null;
    window.location.href = '../index.html';
}

// Load All Data
async function loadAllData() {
    await Promise.all([
        loadStudents(),
        loadEmployers(),
        loadJobs(),
        loadApplications()
    ]);
    updateStats();
}

async function loadStudents() {
    try {
        const response = await fetch(`${API_BASE}/admin/students`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            allStudents = await response.json();
            displayStudents();
        } else {
            // Fallback: Load from users endpoint
            const usersResponse = await fetch(`${API_BASE}/admin/users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                allStudents = users.filter(u => u.role === 'student');
                displayStudents();
            }
        }
    } catch (error) {
        console.error('Error loading students:', error);
        document.getElementById('studentsTableBody').innerHTML = 
            '<tr><td colspan="9" style="text-align:center; color:#dc3545;">Error loading students data</td></tr>';
    }
}

async function loadEmployers() {
    try {
        const response = await fetch(`${API_BASE}/admin/employers`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            allEmployers = await response.json();
            displayEmployers();
        } else {
            // Fallback
            const usersResponse = await fetch(`${API_BASE}/admin/users`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            if (usersResponse.ok) {
                const users = await usersResponse.json();
                allEmployers = users.filter(u => u.role === 'employer');
                displayEmployers();
            }
        }
    } catch (error) {
        console.error('Error loading employers:', error);
        document.getElementById('employersTableBody').innerHTML = 
            '<tr><td colspan="8" style="text-align:center; color:#dc3545;">Error loading employers data</td></tr>';
    }
}

async function loadJobs() {
    try {
        const response = await fetch(`${API_BASE}/admin/jobs`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            allJobs = await response.json();
            displayJobs();
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        document.getElementById('jobsTableBody').innerHTML = 
            '<tr><td colspan="8" style="text-align:center; color:#dc3545;">Error loading jobs data</td></tr>';
    }
}

async function loadApplications() {
    try {
        const response = await fetch(`${API_BASE}/admin/applications`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            allApplications = await response.json();
            displayApplications();
        }
    } catch (error) {
        console.error('Error loading applications:', error);
        document.getElementById('applicationsTableBody').innerHTML = 
            '<tr><td colspan="6" style="text-align:center; color:#dc3545;">Error loading applications data</td></tr>';
    }
}

// Display Functions
function displayStudents() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '';
    
    if (allStudents.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No students registered yet</td></tr>';
        return;
    }
    
    allStudents.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.id}</td>
            <td>${student.firstName} ${student.lastName}</td>
            <td>${student.email}</td>
            <td>${student.college || 'N/A'}</td>
            <td>${student.course || 'N/A'}</td>
            <td>${student.graduationYear || 'N/A'}</td>
            <td>${student.phone || 'N/A'}</td>
            <td>${new Date(student.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewUserDetails(${student.id}, 'student')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayEmployers() {
    const tbody = document.getElementById('employersTableBody');
    tbody.innerHTML = '';
    
    if (allEmployers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No employers registered yet</td></tr>';
        return;
    }
    
    allEmployers.forEach(employer => {
        const jobsCount = allJobs.filter(j => j.employerId === employer.id).length;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employer.id}</td>
            <td>${employer.firstName} ${employer.lastName}</td>
            <td>${employer.email}</td>
            <td>${employer.companyName || 'N/A'}</td>
            <td>${employer.phone || 'N/A'}</td>
            <td>${jobsCount}</td>
            <td>${new Date(employer.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="action-btn view-btn" onclick="viewUserDetails(${employer.id}, 'employer')">View</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayJobs() {
    const tbody = document.getElementById('jobsTableBody');
    tbody.innerHTML = '';
    
    if (allJobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No jobs posted yet</td></tr>';
        return;
    }
    
    allJobs.forEach(job => {
        const employer = allEmployers.find(e => e.id === job.employerId);
        const companyName = employer ? (employer.companyName || `${employer.firstName} ${employer.lastName}`) : 'Unknown';
        const applicationsCount = allApplications.filter(a => a.jobId === job.id).length;
        
        let skills = [];
        try {
            skills = typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills;
        } catch (e) {
            skills = [];
        }
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${job.id}</td>
            <td>${job.title}</td>
            <td>${companyName}</td>
            <td>${job.location}</td>
            <td>${Array.isArray(skills) ? skills.join(', ') : ''}</td>
            <td>${job.experienceYears || 0}y ${job.experienceMonths || 0}m</td>
            <td>${applicationsCount}</td>
            <td>${new Date(job.createdAt).toLocaleDateString()}</td>
        `;
        tbody.appendChild(row);
    });
}

function displayApplications() {
    const tbody = document.getElementById('applicationsTableBody');
    tbody.innerHTML = '';
    
    if (allApplications.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No applications submitted yet</td></tr>';
        return;
    }
    
    allApplications.forEach(app => {
        const student = allStudents.find(s => s.id === app.studentId);
        const job = allJobs.find(j => j.id === app.jobId);
        const employer = job ? allEmployers.find(e => e.id === job.employerId) : null;
        
        const studentName = student ? `${student.firstName} ${student.lastName}` : 'Unknown';
        const jobTitle = job ? job.title : 'Unknown';
        const companyName = employer ? (employer.companyName || `${employer.firstName} ${employer.lastName}`) : 'Unknown';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${app.id}</td>
            <td>${studentName}</td>
            <td>${jobTitle}</td>
            <td>${companyName}</td>
            <td>${new Date(app.appliedDate).toLocaleDateString()}</td>
            <td><span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function updateStats() {
    document.getElementById('totalStudents').textContent = allStudents.length;
    document.getElementById('totalEmployers').textContent = allEmployers.length;
    document.getElementById('totalJobs').textContent = allJobs.length;
    document.getElementById('totalApplications').textContent = allApplications.length;
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.remove('hidden');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}

// Search/Filter Functions
function filterStudents() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#studentsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterEmployers() {
    const searchTerm = document.getElementById('employerSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#employersTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterJobs() {
    const searchTerm = document.getElementById('jobSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#jobsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterApplications() {
    const searchTerm = document.getElementById('applicationSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#applicationsTableBody tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function filterMessages(type) {
    // Remove active class from all filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked button
    event.target.classList.add('active');
    
    // Filter logic would go here
    console.log('Filtering messages by:', type);
}

// View User Details Modal
async function viewUserDetails(userId, userType) {
    const user = userType === 'student' 
        ? allStudents.find(s => s.id === userId)
        : allEmployers.find(e => e.id === userId);
    
    if (!user) return;
    
    const modal = document.getElementById('userDetailModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${userType.charAt(0).toUpperCase() + userType.slice(1)} Details`;
    
    let detailsHTML = `
        <div class="detail-row">
            <strong>ID:</strong> ${user.id}
        </div>
        <div class="detail-row">
            <strong>Name:</strong> ${user.firstName} ${user.lastName}
        </div>
        <div class="detail-row">
            <strong>Username:</strong> ${user.username}
        </div>
        <div class="detail-row">
            <strong>Email:</strong> ${user.email}
        </div>
    `;
    
    if (userType === 'student') {
        detailsHTML += `
            <div class="detail-row">
                <strong>College:</strong> ${user.college || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Course:</strong> ${user.course || 'N/A'}
            </div>
            <div class="detail-row">
                <strong>Graduation Year:</strong> ${user.graduationYear || 'N/A'}
            </div>
        `;
        
        // Show applications
        const userApplications = allApplications.filter(a => a.studentId === userId);
        if (userApplications.length > 0) {
            detailsHTML += `
                <div class="detail-section">
                    <h3>Applications (${userApplications.length})</h3>
                    <ul>
            `;
            userApplications.forEach(app => {
                const job = allJobs.find(j => j.id === app.jobId);
                const jobTitle = job ? job.title : 'Unknown';
                detailsHTML += `
                    <li>
                        ${jobTitle} - 
                        <span class="status-badge status-${app.status}">${app.status}</span>
                        (${new Date(app.appliedDate).toLocaleDateString()})
                    </li>
                `;
            });
            detailsHTML += '</ul></div>';
        }
    } else {
        detailsHTML += `
            <div class="detail-row">
                <strong>Company:</strong> ${user.companyName || 'N/A'}
            </div>
        `;
        
        // Show jobs
        const userJobs = allJobs.filter(j => j.employerId === userId);
        if (userJobs.length > 0) {
            detailsHTML += `
                <div class="detail-section">
                    <h3>Jobs Posted (${userJobs.length})</h3>
                    <ul>
            `;
            userJobs.forEach(job => {
                const jobApplications = allApplications.filter(a => a.jobId === job.id);
                detailsHTML += `
                    <li>
                        ${job.title} - ${job.location} 
                        (${jobApplications.length} applications)
                    </li>
                `;
            });
            detailsHTML += '</ul></div>';
        }
    }
    
    detailsHTML += `
        <div class="detail-row">
            <strong>Phone:</strong> ${user.phone || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Address:</strong> ${user.address || 'N/A'}
        </div>
        <div class="detail-row">
            <strong>Registered:</strong> ${new Date(user.createdAt).toLocaleString()}
        </div>
    `;
    
    modalBody.innerHTML = detailsHTML;
    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('userDetailModal').classList.add('hidden');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('userDetailModal');
    if (event.target === modal) {
        closeModal();
    }
}