# Product Requirements Document (PRD)

## CareerCraft Platform

### 1. Overview
CareerCraft is a recruitment and career management platform connecting students with employers. It features job posting, candidate application management, OTP authentication, and integration with specialized microservices (ResumeCraft and QuizCraft).

---

### 2. User Roles & Permissions

- **Student**: Browse active job listings, apply for positions, verify OTP email, manage profile, access ResumeCraft and QuizCraft.
- **Employer**: Post jobs, review candidate applications, accept/reject candidates, track hiring metrics.
- **Admin**: System-wide oversight for managing platform data, users, and overall analytics.

---

### 3. Core Modules

#### 3.1 Authentication & Security
- **Registration**: Collects profile details and sends email OTP before inserting user data into the database.
- **OTP Verification**: Validates 6-digit OTP code before completing user registration and profile creation.
- **Auth**: JWT-based session security.

#### 3.2 Job & Application Engine
- Employers can create, update, and close job postings.
- Students can search listings and submit applications.
- Status tracking: `pending` ➔ `accepted` / `rejected`.

#### 3.3 Microservices Integration
- **ResumeCraft**: Embedded iframe (`RESUME_SERVICE_URL`) for AI resume generation.
- **QuizCraft**: Embedded iframe (`QUIZ_SERVICE_URL`) for AI skill assessments.

---

### 4. Technical Stack

- **Frontend**: React (Vite), React Router, CSS Modules
- **Backend**: Node.js, Express.js (MVC)
- **Database**: MySQL
- **Email Delivery**: Resend API
