# CareerCraft

CareerCraft is a full stack web application designed to bridge the gap between students and employers. The system enables employers to post jobs and manage applications, while empowering students to apply for roles, generate AI-powered resumes, and test their knowledge via AI quizzes. It features robust user authentication, role-based access control, and comprehensive admin oversight.

**Live:** [careercraft-gebt.onrender.com](https://careercraft-gebt.onrender.com/)

---

## Product Overview

CareerCraft enables employers to post jobs and manage applications, while empowering students to apply for roles, generate AI-powered resumes, and test their knowledge via AI quizzes. It features robust user authentication, role-based access control, and comprehensive admin oversight.

### Target Users

- **Employers:** Create and manage job postings, review applications, and update statuses.
- **Students:** Browse active listings, submit applications, generate AI resumes, and take AI-generated subject quizzes.
- **Admin:** Oversee all platform activity, monitor metrics, and manage system data.

---

## Core Features

- **Authentication & Authorization:** JWT-based login with distinct role-based access (Student, Employer, Admin).
- **Job & Application Management:** Full lifecycle tracking from posting jobs to reviewing candidates and updating statuses.
- **AI Integrations (Gemini 2.5):**
  - **AI Resume Builder:** Generates ATS-compliant `.docx` resumes.
  - **Skill Quizzes:** Role-specific MCQ tests with rate limiting.
- **Dashboards & Analytics:** Real-time metrics for employers, students, and admins.

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (SPA)
- **Backend:** Node.js + Express.js REST API (MVC Architecture)
- **Database:** MySQL / TiDB (hosted)
- **Auth:** JWT-based authentication
- **AI:** Google Gemini (`gemini-2.5-flash`)
- **Email:** Resend API

---

## Getting Started

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd CareerCraft
npm install
```

### 2. Configure Environment

Create a `.env` file in the root directory:

```env
MYSQLHOST=localhost
MYSQLUSER=root
MYSQLPASSWORD=your_password
MYSQL_DATABASE=careercraft
MYSQLPORT=3306

JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key

ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Run the Application

```bash
npm start
```

The server will boot, automatically initialize the database schema, and run on `http://localhost:5000`.

---

## Project Structure

```text
├── backend/
│   ├── public/              # Static assets and resume uploads
│   └── src/                 # MVC Backend Architecture
│       ├── controllers/     # Route business logic
│       ├── db/              # Database configuration
│       ├── middlewares/     # Auth and file handling
│       ├── models/          # Database table schemas
│       ├── routes/          # API route definitions
│       ├── utils/           # Helper functions
│       ├── validators/      # Request validation logic
│       ├── app.js           # Express application setup
│       └── index.js         # Server entry point
├── frontend/                # Client-side SPA
└── package.json
```
