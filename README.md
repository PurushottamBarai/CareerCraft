# CareerCraft

A full-stack career platform connecting students with employers. Built for the **ThinkAI 3.0** hackathon.

**Live:** [careercraft-gebt.onrender.com](https://careercraft-gebt.onrender.com/)

---

## Features

| Feature | Description |
|---|---|
| **Job Board** | Employers post listings; students browse and apply |
| **Student Dashboard** | Track applications and skill-based quiz scores |
| **Employer Dashboard** | Manage postings and view applicant stats |
| **AI Resume Builder** | Generates ATS-compliant `.docx` resumes via Gemini AI |
| **Skill Quizzes** | Role-specific MCQ tests with rate limiting |
| **Career Roadmaps** | Curated portal linking to roadmap.sh paths |
| **Contests & Hackathons** | Platform cards linking to Devpost, MLH, Kaggle, etc. |
| **Find Internships** | Platform cards linking to Internshala, LinkedIn, etc. |
| **Contact Support** | Validated contact form with email verification |
| **Institute Admin** | Separate portal for ecosystem oversight |

---

## Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript (SPA)
- **Backend:** Node.js + Express.js REST API
- **Database:** MySQL / TiDB (hosted)
- **Auth:** JWT-based authentication
- **AI:** Google Gemini (`gemini-2.5-flash`)
- **Email:** Resend API + Formsubmit.co
- **Hosting:** Render (backend + frontend served together)

---

## Getting Started

### 1. Clone & install
```bash
git clone <your-repo-url>
cd CareerCraft
npm install
```

### 2. Configure environment
Create a `.env` file in the root:
```env
# Database (MySQL / TiDB)
MYSQLHOST=localhost
MYSQLUSER=root
MYSQLPASSWORD=your_password
MYSQL_DATABASE=careercraft
MYSQLPORT=3306

# Auth
JWT_SECRET=your_jwt_secret

# AI
GEMINI_API_KEY=your_gemini_api_key

# Email
RESEND_API_KEY=your_resend_api_key

# Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Run
```bash
npm start
```
Server runs on `http://localhost:5000` by default.

---

## Project Structure

```
├── backend/
│   ├── server.js           # Main Express server & all API routes
│   └── resume-generator.js # DOCX generation logic
├── frontend/
│   ├── index.html          # SPA entry point
│   ├── script.js           # Client-side routing & API calls
│   ├── styles.css          # Global styles
│   ├── home/               # Landing page
│   ├── roadmaps/           # Career Roadmaps portal
│   ├── hackathons/         # Contests & Hackathons portal
│   ├── internships/        # Find Internships portal
│   ├── contact/            # Contact form
│   ├── quiz/               # Skill quiz UI
│   ├── resume/             # Resume builder UI
│   └── about/              # About page
└── package.json
```
