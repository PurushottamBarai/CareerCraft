# Product Requirements Document (PRD)

## CareerCraft Backend

### 1. Product Overview

**Product Name:** CareerCraft Backend  
**Version:** 1.0.0  
**Product Type:** Backend API for Career & Recruitment Platform

CareerCraft Backend is a RESTful API service designed to bridge the gap between students and employers. The system enables employers to post jobs and manage applications, while empowering students to apply for roles, generate AI-powered resumes, and test their knowledge via AI quizzes. It features robust user authentication, role-based access control, and comprehensive admin oversight.

### 2. Target Users

- **System Administrators (Admin):** Oversee all platform activity, monitor user metrics, and manage user/job data across the system.
- **Employers:** Create and manage job postings, review student applications, and update application statuses.
- **Students:** Browse active job listings, submit applications with resume uploads, generate AI resumes, and take AI-generated subject quizzes.

### 3. Core Features

#### 3.1 User Authentication & Authorization

- **User Registration:** Account creation with distinct roles (Student or Employer).
- **User Login:** Secure authentication utilizing JWT tokens.
- **Profile Management:** Users can view, update, and delete their respective profile information.
- **Role-Based Access Control:** Strict permission system preventing cross-role data access (e.g., Students cannot post jobs).
- **Email Notifications:** HTTP-based email delivery (via Resend) for welcome emails upon registration.

#### 3.2 Job Management

- **Job Creation:** Employers can post new opportunities with required skills, experience, and location.
- **Job Listing:** Students can view all active jobs; Employers can view their own specific postings.
- **Job Deletion:** Employers can remove their active job listings.

#### 3.3 Application Management

- **Application Submission:** Students can apply to jobs and upload their resumes (PDF/DOCX).
- **Application Tracking:** Students can view the status of all their submitted applications.
- **Candidate Review:** Employers can view all applications submitted for their specific jobs.
- **Status Updates:** Employers can transition application states (Pending, Accepted, Rejected).

#### 3.4 AI Integrations

- **AI Resume Generator:** Generates professional DOCX resumes based on user-provided details (education, skills, etc.) with strict rate limiting.
- **AI Quiz Engine:** Dynamically generates subject-specific multiple-choice quizzes using the Gemini API.
- **Attempt Tracking:** Logs quiz scores and enforces usage limits for both authenticated users and guests.

#### 3.5 Dashboards & Analytics

- **Employer Stats:** Real-time metrics on total jobs posted and application status breakdowns.
- **Student Stats:** Real-time metrics on total applications submitted and their current statuses.
- **Admin Stats:** Global platform statistics encompassing all users, jobs, and applications.

#### 3.6 System Integrity

- **Contact Validation:** Secure endpoint for validating user contact/feedback submissions.
- **Modular MVC Architecture:** Highly maintainable codebase utilizing separated controllers, routes, and validators.

### 4. Technical Specifications

#### 4.1 API Endpoints Structure

**Authentication Routes** (`/api/auth/`)

- `POST /register` - User registration (Student/Employer)
- `POST /login` - User authentication
- `GET /profile` - Retrieve current user profile (secured)
- `PUT /profile` - Update profile information (secured)
- `DELETE /profile` - Delete user account (secured)

**Admin Routes** (`/api/admin/`)

- `GET /users` - List all generic users (secured, Admin only)
- `GET /students` - List all student profiles (secured, Admin only)
- `GET /employers` - List all employer profiles (secured, Admin only)
- `GET /jobs` - List all platform jobs (secured, Admin only)
- `GET /applications` - List all platform applications (secured, Admin only)
- `GET /stats` - Retrieve global platform statistics (secured, Admin only)

**Job Routes** (`/api/jobs/`)

- `GET /` - List all active jobs (secured)
- `GET /employer` - List jobs created by the current employer (secured, Employer only)
- `POST /` - Create a new job posting (secured, Employer only)
- `DELETE /:id` - Delete a specific job posting (secured, Employer only)

**Application Routes** (`/api/applications/`)

- `GET /student` - List all applications submitted by the current student (secured, Student only)
- `GET /job/:jobId` - List all applications for a specific job (secured, Employer only)
- `POST /` - Submit a new application with file upload (secured, Student only)
- `PATCH /:id/status` - Update an application's status (secured, Employer only)

**Stats Routes** (`/api/stats/`)

- `GET /employer` - Retrieve dashboard stats for current employer (secured, Employer only)
- `GET /student` - Retrieve dashboard stats for current student (secured, Student only)

**AI Resume Routes** (`/api/resume/`)

- `POST /generate` - Generate and download an AI DOCX resume (optional auth, rate-limited)

**AI Quiz Routes** (`/api/quiz/`)

- `GET /status` - Check current quiz rate limit status (optional auth)
- `POST /generate` - Generate a new AI quiz (optional auth, rate-limited)
- `POST /submit` - Record quiz attempt score (optional auth)

**Contact Routes** (`/api/contact/`)

- `POST /validate` - Validate contact form submission payload

#### 4.2 Permission Matrix

| Feature                         | Admin | Employer | Student | Guest |
| ------------------------------- | ----- | -------- | ------- | ----- |
| View Platform Stats             | ✓     | ✗        | ✗       | ✗     |
| Create Job Posting              | ✗     | ✓        | ✗       | ✗     |
| Update Application Status       | ✗     | ✓        | ✗       | ✗     |
| View Own Job Applications       | ✗     | ✓        | ✗       | ✗     |
| View Active Jobs Board          | ✓     | ✓        | ✓       | ✗     |
| Submit Job Application          | ✗     | ✗        | ✓       | ✗     |
| Generate AI Resume              | ✓     | ✓        | ✓       | ✓     |
| Take AI Quiz                    | ✓     | ✓        | ✓       | ✓     |
| Manage Profile                  | ✓     | ✓        | ✓       | ✗     |

#### 4.3 Data Models

**User Roles:**

- `admin` - Full platform oversight
- `employer` - Can post jobs and hire
- `student` - Can browse and apply to jobs

**Application Status:**

- `pending` - Application received, awaiting review
- `accepted` - Employer has accepted the candidate
- `rejected` - Employer has declined the candidate

### 5. Security Features

- JWT-based authentication for secure session management
- Strict Role-based authorization middleware enforcing the Permission Matrix
- Extracted Validation middleware on all sensitive POST/PUT endpoints
- Rate limiting implemented on AI generation endpoints to prevent quota exhaustion
- Secure password hashing utilizing bcryptjs
- File upload security with Multer (type checking, size limits)

### 6. File Management

- Support for resume document uploads (PDF, DOCX)
- Files securely stored locally in `backend/public/uploads` directory
- Static serving of uploaded assets configured safely in Express

### 7. Success Criteria

- Clean, modular MVC architecture (Routes, Controllers, Models, Middlewares, Validators)
- Secure user authentication and robust RBAC
- Fully functional job posting and application lifecycle
- Seamless integration with Gemini AI for resume and quiz generation
- Secure file upload handling preventing malicious uploads
