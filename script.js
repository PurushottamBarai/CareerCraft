let currentUser = null;
let jobs = [];
let applications = [];

// Enhanced API URL detection for Railway deployment
const API_BASE = (() => {
  const hostname = window.location.hostname;
  const port = window.location.port;
  const protocol = window.location.protocol;

  console.log("Current location:", { hostname, port, protocol });

  // Local development
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:${port || 5000}/api`;
  }

  // Railway production (or any other production environment)
  return "/api";
})();

console.log("API Base URL:", API_BASE);

document.addEventListener("DOMContentLoaded", function () {
  checkAuthStatus();
  setupEventListeners();
  loadFooter();
});

function setupEventListeners() {
  document
    .getElementById("loginFormData")
    .addEventListener("submit", handleLogin);
  document
    .getElementById("employerRegisterForm")
    .addEventListener("submit", handleEmployerRegister);
  document
    .getElementById("studentRegisterForm")
    .addEventListener("submit", handleStudentRegister);
  document
    .getElementById("postJobForm")
    .addEventListener("submit", handlePostJob);
  document
    .getElementById("applyJobForm")
    .addEventListener("submit", handleApplyJob);

  // Handle clicks outside dropdowns to close them
  document.addEventListener("click", function (e) {
    // Handle profile dropdown
    const profileDropdown = document.getElementById("profileDropdown");
    const profileBtn = document.querySelector(".profile-btn");

    if (profileBtn && profileDropdown) {
      // Check if click is on the profile button
      if (profileBtn.contains(e.target)) {
        e.stopPropagation();
        profileDropdown.classList.toggle("hidden");
      } else if (!profileDropdown.contains(e.target)) {
        // Click outside both button and dropdown - close it
        profileDropdown.classList.add("hidden");
      }
    }

    // Handle register dropdown
    const registerDropdown = document.getElementById("registerDropdown");
    const registerBtn = document.querySelector(
      ".register-menu .nav-btn.register"
    );

    if (registerDropdown && registerBtn) {
      if (
        !registerBtn.contains(e.target) &&
        !registerDropdown.contains(e.target)
      ) {
        registerDropdown.classList.add("hidden");
      }
    }
  });
}

async function loadHomeContent() {
  try {
    const response = await fetch("home/home.html");
    const html = await response.text();

    // Extract just the body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const bodyContent = doc.body.innerHTML;

    // Insert into homeSection
    document.getElementById("homeSection").innerHTML = bodyContent;
  } catch (error) {
    console.error("Error loading home content:", error);
  }
}

function showHome() {
  hideAllSections();
  const homeSection = document.getElementById("homeSection");
  const container = document.querySelector(".container");

  homeSection.classList.remove("hidden");
  container.classList.add("home-active"); // Add special class

  loadHomeContent();
}
async function handleApplyJob(e) {
  e.preventDefault();
  const formData = new FormData(e.target);

  try {
    const response = await fetch(`${API_BASE}/applications`, {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      alert("Application submitted successfully!");
      closeApplyModal();
      loadMyApplications();
    } else {
      alert(result.message || "Failed to submit application");
    }
  } catch (error) {
    console.error("Apply job error:", error);
    alert("Failed to submit application. Please try again.");
  }
}

function checkAuthStatus() {
  console.log("Checking authentication status...");

  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");

  console.log("User in storage:", !!user);
  console.log("Token in storage:", !!token);

  if (user && token) {
    try {
      currentUser = JSON.parse(user);
      console.log("Current user loaded:", currentUser);

      if (currentUser && currentUser.role && currentUser.firstName) {
        updateNavigation();

        if (currentUser.role === "admin") {
          window.location.href = "institute/institute.html";
          return true;
        } else if (currentUser.role === "employer") {
          showEmployerDashboard();
        } else {
          showStudentDashboard();
        }
        return true;
      } else {
        throw new Error("Invalid user data");
      }
    } catch (e) {
      console.error("Error parsing stored user:", e);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      currentUser = null;
    }
  }

  console.log("No valid session found, showing home");
  showHome();
  return false;
}

function updateNavigation() {
  const guestNav = document.getElementById("guestNavLinks");
  const userNav = document.getElementById("userNavLinks");

  if (currentUser) {
    guestNav.classList.add("hidden");
    userNav.classList.remove("hidden");

    const profileNameEl = document.getElementById("profileName");
    const welcomeMessageEl = document.getElementById("welcomeMessage");

    // Fix: Handle null lastName
    const lastName = currentUser.lastName || '';
    if (profileNameEl)
      profileNameEl.textContent = `${currentUser.firstName} ${lastName}`.trim();
    if (welcomeMessageEl)
      welcomeMessageEl.textContent = `Welcome, ${currentUser.firstName}!`;

    if (currentUser.profileImage) {
      const profileImageEl = document.getElementById("profileImage");
      if (profileImageEl) profileImageEl.src = currentUser.profileImage;
    }
  } else {
    guestNav.classList.remove("hidden");
    userNav.classList.add("hidden");
  }
}
// Navigation functions
function showLogin() {
  hideAllSections();
  document.getElementById("loginForm").classList.remove("hidden");
}

function showEmployerRegister() {
  hideAllSections();
  document.getElementById("employerRegister").classList.remove("hidden");
  // Close register dropdown
  const dropdown = document.getElementById("registerDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function showStudentRegister() {
  hideAllSections();
  document.getElementById("studentRegister").classList.remove("hidden");
  // Close register dropdown
  const dropdown = document.getElementById("registerDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function showEmployerDashboard() {
  hideAllSections();
  document.getElementById("employerDashboard").classList.remove("hidden");
  updateNavigation();
  showPostJob();
  loadEmployerJobs();
  loadEmployerStats();
}

function showStudentDashboard() {
  hideAllSections();
  document.getElementById("studentDashboard").classList.remove("hidden");
  updateNavigation();
  showBrowseJobs();
  loadAvailableJobs();
  loadStudentStats();
}

function hideAllSections() {
  const sections = document.querySelectorAll(
    ".form-section, .dashboard-section"
  );
  sections.forEach((section) => section.classList.add("hidden"));

  // Remove home-active class when hiding
  const container = document.querySelector(".container");
  if (container) {
    container.classList.remove("home-active");
  }
}

function showPostJob(event) {
  console.log("Showing post job section");
  setActiveTab(event);
  document.getElementById("postJobSection").classList.remove("hidden");
  document.getElementById("myJobsSection").classList.add("hidden");
}

function showMyJobs(event) {
  console.log("Showing my jobs section");
  setActiveTab(event);
  document.getElementById("postJobSection").classList.add("hidden");
  document.getElementById("myJobsSection").classList.remove("hidden");
  loadEmployerJobs();
}

function showBrowseJobs(event) {
  console.log("Showing browse jobs section");
  setActiveTab(event);
  document.getElementById("browseJobsSection").classList.remove("hidden");
  document.getElementById("myApplicationsSection").classList.add("hidden");
  loadAvailableJobs();
}

function showMyApplications(event) {
  console.log("Showing my applications section");
  setActiveTab(event);
  document.getElementById("browseJobsSection").classList.add("hidden");
  document.getElementById("myApplicationsSection").classList.remove("hidden");
  loadMyApplications();
}

function setActiveTab(event) {
  console.log("Setting active tab, event:", event);

  // Remove active class from all buttons
  document.querySelectorAll(".dash-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  // Add active class to clicked button if event exists
  if (event && event.target) {
    event.target.classList.add("active");
  } else {
    // Fallback: find and activate the first button if no event
    const firstBtn = document.querySelector(".dash-btn");
    if (firstBtn) {
      firstBtn.classList.add("active");
    }
  }
}
function toggleRegisterDropdown(event) {
  event.stopPropagation();
  const dropdown = document.getElementById("registerDropdown");
  dropdown.classList.toggle("hidden");
}

// Profile functions
function profileDropdown(event) {
  if (event) {
    event.stopPropagation();
  }
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

function showProfile() {
  hideAllSections();
  document.getElementById("profileSection").classList.remove("hidden");
  loadProfile();
  // Close dropdown
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function showEditProfile() {
  hideAllSections();
  document.getElementById("editProfileSection").classList.remove("hidden");
  loadEditProfile();
  // Close dropdown
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function showDashboardStats() {
  hideAllSections();
  document.getElementById("statsSection").classList.remove("hidden");
  loadDetailedStats();
  // Close dropdown
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

function hideProfileSection() {
  if (currentUser.role === "employer") {
    showEmployerDashboard();
  } else {
    showStudentDashboard();
  }
}

function hideEditProfileSection() {
  showProfile();
}

function hideStatsSection() {
  if (currentUser.role === "employer") {
    showEmployerDashboard();
  } else {
    showStudentDashboard();
  }
}

// Authentication handlers
async function handleLogin(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const loginData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData),
    });

    const result = await response.json();

    if (response.ok) {
      currentUser = result.user;
      localStorage.setItem("user", JSON.stringify(currentUser));
      localStorage.setItem("token", result.token);

      // Check user role and redirect accordingly
      if (currentUser.role === "admin") {
        // Redirect to institute admin panel
        window.location.href = "institute/institute.html";
      } else if (currentUser.role === "employer") {
        showEmployerDashboard();
      } else {
        showStudentDashboard();
      }
    } else {
      alert(result.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again.");
  }
}

async function handleEmployerRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  if (formData.get('password') !== formData.get('confirmPassword')) {
    alert('Passwords do not match');
    return;
  }
  
  const registerData = {
    firstName: formData.get('companyName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    password: formData.get('password'),
    role: 'employer',
    companyName: formData.get('companyName')
  };
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Registration successful! Please login.');
      showLogin();
    } else {
      alert(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  }
}

async function handleStudentRegister(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  if (formData.get('password') !== formData.get('confirmPassword')) {
    alert('Passwords do not match');
    return;
  }
  
  const registerData = {
    firstName: formData.get('firstName'),
    lastName: formData.get('firstName'), 
    username: formData.get('username'),
    email: formData.get('email'),
    course: formData.get('course'),
    graduationYear: formData.get('graduationYear') || null,
    phone: formData.get('phone'),
    password: formData.get('password'),
    role: 'student'
  };
  
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      alert('Registration successful! Please login.');
      showLogin();
    } else {
      alert(result.message || 'Registration failed');
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  }
}

// Job management
async function handlePostJob(e) {
  e.preventDefault();

  const formData = new FormData(e.target);

  // Get selected skills
  const skillCheckboxes = document.querySelectorAll(
    'input[name="skills"]:checked'
  );
  const skills = Array.from(skillCheckboxes).map((cb) => cb.value);

  // Enhanced validation
  const title = formData.get("jobTitle")?.trim();
  const description = formData.get("jobDescription")?.trim();
  const location = formData.get("location")?.trim();

  if (!title || !description || !location) {
    alert("Please fill in all required fields (Title, Description, Location).");
    return;
  }

  if (skills.length === 0) {
    alert("Please select at least one required skill.");
    return;
  }

  const jobData = {
    title: title,
    description: description,
    skills: skills,
    experienceYears: parseInt(formData.get("experienceYears")) || 0,
    experienceMonths: parseInt(formData.get("experienceMonths")) || 0,
    location: location,
    salary: formData.get("salary")?.trim() || null,
  };

  console.log("Posting job with data:", jobData);

  try {
    const response = await fetch(`${API_BASE}/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(jobData),
    });

    const result = await response.json();
    console.log("Server response:", result);

    if (response.ok) {
      // Show success message
      const msgElement = document.querySelector(
        "#postJobSection .success-message"
      );
      if (msgElement) {
        msgElement.classList.remove("hidden");
        setTimeout(() => {
          msgElement.classList.add("hidden");
        }, 3000);
      }

      // Reset form and reload jobs
      e.target.reset();
      await loadEmployerJobs();

      alert("Job posted successfully!");
    } else {
      console.error("Job posting failed:", result);
      alert(result.message || "Failed to post job. Please try again.");
    }
  } catch (error) {
    console.error("Network error:", error);
    alert("Network error. Please check your connection and try again.");
  }
}

// Load jobs functions
async function loadEmployerJobs() {
  console.log("=== Loading Employer Jobs ===");
  const token = localStorage.getItem("token");
  console.log("Token exists:", !!token);

  try {
    const response = await fetch(`${API_BASE}/jobs/employer`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const jobs = await response.json();
    console.log("Received jobs:", jobs);

    const jobsList = document.getElementById("employerJobsList");
    if (!jobsList) {
      console.error("employerJobsList element not found");
      return;
    }

    jobsList.innerHTML = "";

    if (jobs.length === 0) {
      jobsList.innerHTML =
        '<div style="padding: 2rem; text-align: center; color: #666;">No jobs posted yet.</div>';
      return;
    }

    jobs.forEach((job) => {
      const jobRow = document.createElement("div");
      jobRow.className = "job-row";
      jobRow.innerHTML = `
                <div>${job.title || "Untitled"}</div>
                <div>${
                  Array.isArray(job.skills)
                    ? job.skills.join(", ")
                    : "No skills listed"
                }</div>
                <div>${job.experienceYears || 0}y ${
        job.experienceMonths || 0
      }m</div>
                <div>${job.applicationCount || 0}</div>
                <div>
                    <button class="view-btn" onclick="viewApplications(${
                      job.id
                    })">
                        View Apps (${job.applicationCount || 0})
                    </button>
                </div>
            `;
      jobsList.appendChild(jobRow);
    });
  } catch (error) {
    console.error("Failed to fetch employer jobs:", error);
    const jobsList = document.getElementById("employerJobsList");
    if (jobsList) {
      jobsList.innerHTML = `<div style="padding: 2rem; text-align: center; color: #dc3545;">
                Error loading jobs: ${error.message}
            </div>`;
    }
  }
}

async function loadAvailableJobs() {
  console.log("=== Loading Available Jobs for Students ===");
  try {
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);

    const response = await fetch(`${API_BASE}/jobs`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to fetch jobs:", errorText);
      return;
    }

    const jobs = await response.json();
    console.log("Available jobs received:", jobs);

    const jobsList = document.getElementById("jobsList");
    if (!jobsList) {
      console.error("jobsList element not found");
      return;
    }

    jobsList.innerHTML = "";

    if (jobs.length === 0) {
      jobsList.innerHTML =
        '<div style="padding: 1rem; text-align: center; color: #666;">No jobs available at the moment.</div>';
      return;
    }

    jobs.forEach((job) => {
      console.log("Processing job for student:", job);
      const jobRow = document.createElement("div");
      jobRow.className = "job-row";
      const companyName =
        job.companyName || `${job.employerFirstName} ${job.employerLastName}`;
      jobRow.innerHTML = `
                <div>${job.title}</div>
                <div>${companyName}</div>
                <div>${job.skills.join(", ")}</div>
                <div>${job.experienceYears}y ${job.experienceMonths}m</div>
                <div>
                    <button class="apply-btn" onclick="openApplyModal(${
                      job.id
                    }, '${job.title}', '${companyName}')">
                        Apply
                    </button>
                </div>
            `;
      jobsList.appendChild(jobRow);
    });

    console.log("Available jobs loaded successfully");
  } catch (error) {
    console.error("Error loading available jobs:", error);
  }
}

async function loadMyApplications() {
  try {
    const response = await fetch(`${API_BASE}/applications/student`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const applications = await response.json();

    const applicationsList = document.getElementById("applicationsList");
    applicationsList.innerHTML = "";

    applications.forEach((app) => {
      const appRow = document.createElement("div");
      appRow.className = "job-row";
      appRow.innerHTML = `
                <div>${app.jobTitle}</div>
                <div>${
                  app.companyName ||
                  app.employerFirstName + " " + app.employerLastName
                }</div>
                <div>${new Date(app.appliedDate).toLocaleDateString()}</div>
                <div>
                    <span class="status-${app.status.toLowerCase()}">${app.status.toUpperCase()}</span>
                </div>
            `;
      applicationsList.appendChild(appRow);
    });
  } catch (error) {
    console.error("Error loading applications:", error);
  }
}

// Stats loading
async function loadEmployerStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/employer`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const stats = await response.json();

    const statsContainer = document.getElementById("employerStats");
    statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${stats.totalJobs || 0}</span>
                <div class="stat-label">Total Jobs Posted</div>
            </div>
            <div class="stat-card">
                <span class="stat-number">${stats.totalApplications || 0}</span>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card warning">
                <span class="stat-number">${
                  stats.pendingApplications || 0
                }</span>
                <div class="stat-label">Pending Reviews</div>
            </div>
            <div class="stat-card success">
                <span class="stat-number">${
                  stats.acceptedApplications || 0
                }</span>
                <div class="stat-label">Accepted</div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading employer stats:", error);
  }
}

async function loadStudentStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/student`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const stats = await response.json();

    const statsContainer = document.getElementById("studentStats");
    statsContainer.innerHTML = `
            <div class="stat-card">
                <span class="stat-number">${stats.totalApplications || 0}</span>
                <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card warning">
                <span class="stat-number">${
                  stats.pendingApplications || 0
                }</span>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-card success">
                <span class="stat-number">${
                  stats.acceptedApplications || 0
                }</span>
                <div class="stat-label">Accepted</div>
            </div>
            <div class="stat-card danger">
                <span class="stat-number">${
                  stats.rejectedApplications || 0
                }</span>
                <div class="stat-label">Rejected</div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading student stats:", error);
  }
}

function openApplyModal(jobId, jobTitle, companyName) {
  document.getElementById("applyJobId").value = jobId;
  document.getElementById("jobDetails").innerHTML = `
        <h4>${jobTitle}</h4>
        <p><strong>Company:</strong> ${companyName}</p>
    `;
  document.getElementById("applyModal").classList.remove("hidden");
}

function closeApplyModal() {
  document.getElementById("applyModal").classList.add("hidden");
  document.getElementById("applyJobForm").reset();
}

async function viewApplications(jobId) {
  try {
    const response = await fetch(`${API_BASE}/applications/job/${jobId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const applications = await response.json();

    if (applications.length === 0) {
      alert("No applications received for this job yet.");
      return;
    }

    const applicationsHTML = applications
      .map(
        (app) => `
            <div style="border: 1px solid #ddd; padding: 1rem; margin: 0.5rem 0; border-radius: 5px;">
                <strong>${app.studentFirstName} ${
          app.studentLastName
        }</strong><br>
                Email: ${app.studentEmail}<br>
                ${app.college ? `College: ${app.college}<br>` : ""}
                ${app.course ? `Course: ${app.course}<br>` : ""}
                ${app.phone ? `Phone: ${app.phone}<br>` : ""}
                Applied: ${new Date(app.appliedDate).toLocaleDateString()}<br>
                Status: <span class="status-${
                  app.status
                }">${app.status.toUpperCase()}</span><br>
                ${
                  app.resumePath
                    ? `<a href="${app.resumePath}" target="_blank">View Resume</a><br>`
                    : ""
                }
                ${app.coverLetter ? `Cover Letter: ${app.coverLetter}<br>` : ""}
                <div style="margin-top: 0.5rem;">
                    <button onclick="updateApplicationStatus(${
                      app.id
                    }, 'accepted')" 
                            style="background: #28a745; color: white; border: none; padding: 0.3rem 0.8rem; margin-right: 0.5rem; border-radius: 3px; cursor: pointer;">
                        Accept
                    </button>
                    <button onclick="updateApplicationStatus(${
                      app.id
                    }, 'rejected')" 
                            style="background: #dc3545; color: white; border: none; padding: 0.3rem 0.8rem; border-radius: 3px; cursor: pointer;">
                        Reject
                    </button>
                </div>
            </div>
        `
      )
      .join("");

    const modal = document.getElementById("viewApplicationsModal");
    document.getElementById("jobApplicationsList").innerHTML = applicationsHTML;
    modal.classList.remove("hidden");
  } catch (error) {
    console.error("Error loading applications:", error);
    alert("Failed to load applications.");
  }
}

function closeApplicationsModal() {
  document.getElementById("viewApplicationsModal").classList.add("hidden");
}

async function updateApplicationStatus(applicationId, status) {
  try {
    const response = await fetch(
      `${API_BASE}/applications/${applicationId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();

    if (response.ok) {
      alert(`Application ${status} successfully!`);
      closeApplicationsModal();
      loadEmployerJobs();
    } else {
      alert(result.message || "Failed to update application status");
    }
  } catch (error) {
    console.error("Error updating application status:", error);
    alert("Failed to update application status.");
  }
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const profile = await response.json();

    const profileDetails = document.getElementById("profileDetails");
    profileDetails.innerHTML = `
            <div style="display: grid; gap: 1rem;">
                <div><strong>Name:</strong> ${profile.firstName} ${
      profile.lastName
    }</div>
                <div><strong>Username:</strong> ${profile.username}</div>
                <div><strong>Email:</strong> ${profile.email}</div>
                <div><strong>Role:</strong> ${profile.role}</div>
                ${
                  profile.companyName
                    ? `<div><strong>Company:</strong> ${profile.companyName}</div>`
                    : ""
                }
                ${
                  profile.college
                    ? `<div><strong>College:</strong> ${profile.college}</div>`
                    : ""
                }
                ${
                  profile.course
                    ? `<div><strong>Course:</strong> ${profile.course}</div>`
                    : ""
                }
                ${
                  profile.graduationYear
                    ? `<div><strong>Graduation Year:</strong> ${profile.graduationYear}</div>`
                    : ""
                }
                ${
                  profile.phone
                    ? `<div><strong>Phone:</strong> ${profile.phone}</div>`
                    : ""
                }
                ${
                  profile.address
                    ? `<div><strong>Address:</strong> ${profile.address}</div>`
                    : ""
                }
                <div><strong>Member Since:</strong> ${new Date(
                  profile.createdAt
                ).toLocaleDateString()}</div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading profile:", error);
  }
}

function loadEditProfile() {
  const form = document.getElementById("editProfileForm");
  form.firstName.value = currentUser.firstName || "";
  form.lastName.value = currentUser.lastName || "";
  form.phone.value = currentUser.phone || "";
  form.address.value = currentUser.address || "";

  const employerFields = document.getElementById("employerFields");
  const studentFields = document.getElementById("studentFields");

  if (currentUser.role === "employer") {
    employerFields.classList.remove("hidden");
    studentFields.classList.add("hidden");
    if (form.companyName)
      form.companyName.value = currentUser.companyName || "";
  } else {
    employerFields.classList.add("hidden");
    studentFields.classList.remove("hidden");
    if (form.college) form.college.value = currentUser.college || "";
    if (form.course) form.course.value = currentUser.course || "";
    if (form.graduationYear)
      form.graduationYear.value = currentUser.graduationYear || "";
  }
}

function loadDetailedStats() {
  const statsContainer = document.getElementById("detailedStats");

  if (currentUser.role === "employer") {
    loadEmployerDetailedStats();
  } else {
    loadStudentDetailedStats();
  }
}

async function loadEmployerDetailedStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/employer`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const stats = await response.json();

    const statsContainer = document.getElementById("detailedStats");
    statsContainer.innerHTML = `
            <h3>Employer Dashboard Statistics</h3>
            <div class="stats-cards">
                <div class="stat-card">
                    <span class="stat-number">${
                      stats.totalApplications || 0
                    }</span>
                    <div class="stat-label">Total Applications Received</div>
                </div>
                <div class="stat-card warning">
                    <span class="stat-number">${
                      stats.pendingApplications || 0
                    }</span>
                    <div class="stat-label">Pending Reviews</div>
                </div>
                <div class="stat-card success">
                    <span class="stat-number">${
                      stats.acceptedApplications || 0
                    }</span>
                    <div class="stat-label">Applications Accepted</div>
                </div>
                <div class="stat-card danger">
                    <span class="stat-number">${
                      stats.rejectedApplications || 0
                    }</span>
                    <div class="stat-label">Applications Rejected</div>
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading detailed stats:", error);
  }
}

async function loadStudentDetailedStats() {
  try {
    const response = await fetch(`${API_BASE}/stats/student`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    const stats = await response.json();

    const statsContainer = document.getElementById("detailedStats");
    statsContainer.innerHTML = `
            <h3>Student Dashboard Statistics</h3>
            <div class="stats-cards">
                <div class="stat-card">
                    <span class="stat-number">${
                      stats.totalApplications || 0
                    }</span>
                    <div class="stat-label">Total Applications Submitted</div>
                </div>
                <div class="stat-card warning">
                    <span class="stat-number">${
                      stats.pendingApplications || 0
                    }</span>
                    <div class="stat-label">Applications Pending</div>
                </div>
                <div class="stat-card success">
                    <span class="stat-number">${
                      stats.acceptedApplications || 0
                    }</span>
                    <div class="stat-label">Applications Accepted</div>
                </div>
                <div class="stat-card danger">
                    <span class="stat-number">${
                      stats.rejectedApplications || 0
                    }</span>
                    <div class="stat-label">Applications Rejected</div>
                </div>
            </div>
        `;
  } catch (error) {
    console.error("Error loading detailed stats:", error);
  }
}

function filterJobs() {
  const searchTerm = document.getElementById("jobSearch").value.toLowerCase();
  const jobRows = document.querySelectorAll("#jobsList .job-row");

  jobRows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    if (text.includes(searchTerm)) {
      row.style.display = "grid";
    } else {
      row.style.display = "none";
    }
  });
}

function logout() {
  localStorage.removeItem("user");
  localStorage.removeItem("token");
  currentUser = null;
  showLogin();
  updateNavigation();

  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.add("hidden");
}

window.onclick = function (event) {
  const applyModal = document.getElementById("applyModal");
  const viewModal = document.getElementById("viewApplicationsModal");

  if (event.target === applyModal) {
    closeApplyModal();
  }
  if (event.target === viewModal) {
    closeApplicationsModal();
  }
};
// Load footer dynamically
function loadFooter() {
  fetch("footer/footer.html") // Updated path
    .then((response) => {
      if (!response.ok) {
        throw new Error("Footer file not found");
      }
      return response.text();
    })
    .then((data) => {
      const footerContainer = document.getElementById("footerContainer");
      if (footerContainer) {
        footerContainer.innerHTML = data;
      } else {
        console.error("footerContainer element not found");
      }
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });
}
