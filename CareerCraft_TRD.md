# CareerCraft — Technical Requirements Document (TRD)
> Interview Preparation Reference | Purushottam Barai

---

## 1. Project Overview

**CareerCraft** is a full-stack career development platform that connects students, employers, and institute administrators. It enables students to apply for jobs, build resumes, attempt skill quizzes, and access learning roadmaps — while employers can post jobs and manage applications, and admins can oversee the entire platform.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT BROWSER                    │
│            React 19 SPA (Vite build)                │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / REST API
┌──────────────────────▼──────────────────────────────┐
│          MAIN SERVER (Node.js + Express 5)           │
│    Serves frontend static files + REST API           │
│    MySQL via mysql2 | JWT Auth | Multer uploads      │
└──────────┬─────────────────────┬────────────────────┘
           │                     │
┌──────────▼──────────┐ ┌───────▼──────────────────┐
│  ResumeCraft Service │ │    Quiz Service           │
│  (Microservice)      │ │    (Microservice)         │
│  resumecraft-zm2k... │ │    quiz-w0ss...           │
└─────────────────────┘ └──────────────────────────┘
```

### Architecture Pattern
- **Monorepo** with `frontend/` and `backend/` folders in one GitHub repo
- **Monolithic + Microservices hybrid**: the main app is a monolith; AI-powered features (resume builder, quiz) are separate microservices embedded via `<iframe>`
- The Express backend **serves the React build** (`frontend/dist`) as static files — so there is only ONE Render service for both frontend and backend

---

## 3. Tech Stack

### Frontend
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | React | 19.x |
| Bundler | Vite | 8.x |
| Routing | React Router DOM | 7.x |
| State Management | React Context API | (built-in) |
| Linter | oxlint | 1.x |
| Styling | Vanilla CSS | — |

### Backend
| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js | ≥ 18.x |
| Framework | Express | 5.x |
| Database | MySQL | via mysql2 3.x |
| Auth | JWT (jsonwebtoken) | 9.x |
| Password Hashing | bcryptjs | 3.x |
| File Uploads | Multer | 2.x |
| Email Service | Resend | 6.x |
| AI SDK | @google/genai | 1.x |

### Infrastructure
| Service | Platform |
|---------|---------|
| Hosting (Main App) | Render (Free Tier → New service) |
| Resume Microservice | Render → `resumecraft-zm2k.onrender.com` |
| Quiz Microservice | Render → `quiz-w0ss.onrender.com` |
| Database | MySQL (Render / local) |
| Email | Resend (transactional email API) |
| Version Control | GitHub → `PurushottamBarai/CareerCraft` |

---

## 4. Database Schema

### Tables

#### `students`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK, starts at 1000 |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | UNIQUE |
| password | VARCHAR(255) | bcrypt hashed |
| phone | VARCHAR(50) | |
| address | TEXT | |
| college | VARCHAR(255) | |
| course | VARCHAR(255) | |
| graduationYear | VARCHAR(50) | |
| registrationDate | VARCHAR(50) | |
| isEmailVerified | BOOLEAN | Default TRUE |

#### `companies`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK, starts at 1000 |
| name | VARCHAR(255) | NOT NULL, UNIQUE |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | bcrypt hashed |
| phone | VARCHAR(50) | UNIQUE |
| officeAddress | TEXT | |
| registrationDate | VARCHAR(50) | |
| isEmailVerified | BOOLEAN | Default TRUE |

#### `jobs`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| companyId | INT | FK → companies(id) |
| jobTitle | VARCHAR(255) | NOT NULL |
| company | VARCHAR(255) | NOT NULL |
| location | VARCHAR(255) | NOT NULL |
| skillsRequired | JSON | NOT NULL |
| salary | VARCHAR(100) | NOT NULL |
| active | BOOLEAN | Default TRUE |
| createdAt | VARCHAR(50) | |

#### `applications`
| Column | Type | Notes |
|--------|------|-------|
| id | INT AUTO_INCREMENT | PK |
| jobId | INT | FK → jobs(id) CASCADE |
| studentId | INT | FK → students(id) CASCADE |
| resumePath | VARCHAR(500) | nullable |
| coverLetter | TEXT | nullable |
| status | ENUM | `pending` / `accepted` / `rejected` |
| appliedDate | VARCHAR(50) | |

> **Unique constraint**: `(jobId, studentId)` — one student can't apply twice to same job

---

## 5. API Endpoints

### Auth Routes — `/api/auth`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | Register student or employer; sends OTP |
| POST | `/login` | ❌ | Login (student / employer / admin) |
| POST | `/send-otp` | ❌ | Resend OTP email |
| POST | `/verify-otp` | ❌ | Verify OTP → create account in DB |
| GET | `/profile` | ✅ JWT | Get logged-in user profile |
| PUT | `/profile` | ✅ JWT | Update profile |
| DELETE | `/profile` | ✅ JWT | Delete account |

### Job Routes — `/api/jobs`
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/` | ✅ | any | Get all active jobs |
| GET | `/employer` | ✅ | employer | Get jobs posted by this employer |
| POST | `/` | ✅ | employer | Create a new job |
| DELETE | `/:id` | ✅ | employer | Delete a job |

### Application Routes — `/api/applications`
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/student` | ✅ | student | Get student's own applications |
| GET | `/job/:jobId` | ✅ | employer | Get all applications for a job |
| POST | `/` | ✅ | student | Submit application (with resume upload) |
| PATCH | `/:id/status` | ✅ | employer | Update application status |

### Admin Routes — `/api/admin`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/stats` | ✅ JWT | Platform statistics |
| GET | `/students` | ✅ JWT | All students |
| GET | `/employers` | ✅ JWT | All employers/companies |
| GET | `/jobs` | ✅ JWT | All jobs |
| GET | `/applications` | ✅ JWT | All applications |

### Other Routes
| Route | Description |
|-------|-------------|
| `GET /api/stats` | Public platform stats |
| `POST /api/contact` | Contact form submission |

---

## 6. Authentication & Authorization

### Strategy: JWT (JSON Web Token)

#### Flow
```
Login → Server validates credentials → Signs JWT (8h expiry) → Client stores in localStorage
Every protected request → Client sends: Authorization: Bearer <token>
Server middleware verifies token → attaches req.user → allows/denies
```

#### Roles
| Role | Description |
|------|-------------|
| `student` | Can browse jobs, apply, view own applications |
| `employer` | Can post/delete jobs, view/manage applications |
| `admin` | Full platform access via special env-var credentials |

#### Middleware Chain
- **`auth`** — verifies JWT, attaches `req.user`
- **`requireRole(['student'])`** — role-based access control (RBAC)
- **`adminAuth`** — dedicated middleware checks `role === 'admin'`
- **`optionalAuth`** — attaches user if token present, doesn't block if not

#### Admin Login — Special Case
> Admin is NOT stored in DB. Credentials are stored in `.env`:
```
ADMIN_USERNAME=purushottam
ADMIN_PASSWORD=Purushottam@2006
```
On login, the backend directly compares against env vars and issues a JWT with `{ id: 9999, role: "admin" }`.

---

## 7. Registration & OTP Verification Flow

```
User fills Register form
        ↓
POST /api/auth/register
        ↓
Backend generates 5-digit OTP
        ↓
Hashes OTP with bcrypt + encodes into JWT as verificationToken (10 min expiry)
        ↓
Sends OTP email via Resend API
        ↓
Returns verificationToken to client → stored in sessionStorage
        ↓
User enters OTP on /verify-otp page
        ↓
POST /api/auth/verify-otp  (sends email + otp + verificationToken)
        ↓
Backend: JWT.verify(verificationToken) → bcrypt.compare(otp, hashedOtp)
        ↓
If valid → inserts user into students/companies table
        ↓
Account created ✅ → User can now login
```

> **Key Design**: User data is NOT written to DB before OTP verification — it's encoded inside the JWT verificationToken itself. This avoids ghost/unverified records.

---

## 8. Frontend Architecture

### State Management
- **AuthContext** (`React.createContext`) — global auth state
  - Stores: `user`, `token`
  - Persists via `localStorage`
  - Exposes: `login`, `logout`, `registerUser`, `registerEmployer`, `verifyOtp`, `resendOtp`, `API_BASE`

### API Base URL — Smart Detection
```js
const API_BASE = (() => {
  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:5000/api`;  // dev
  }
  return "/api";  // production (same origin)
})();
```

### Route Structure
| Path | Component | Access |
|------|-----------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/verify-otp` | VerifyOtp | Public |
| `/dashboard` | DashboardRoute* | Auth required |
| `/employerdashboard` | EmployerDashboard | Employer only |
| `/admin` | Institute | Admin login page |
| `/institute` | Institute | Admin dashboard |
| `/resume` | ResumeBuilder (iframe) | Public |
| `/quiz` | Quiz (iframe) | Public |
| `/profile` | Profile | Auth required |
| `/roadmaps` | Roadmaps | Public |
| `/internships` | Internships | Public |
| `/hackathons` | Hackathons | Public |
| `/about` | About | Public |
| `/contact` | Contact | Public |

> **`*DashboardRoute`** — Smart redirector: `employer → EmployerDashboard`, `admin → Institute`, `student → StudentDashboard`

### Protected Route Guards
- **`DashboardRoute`** — redirects to `/login` if unauthenticated
- **`EmployerRoute`** — redirects to `/dashboard` if not employer
- **`AdminRoute`** — redirects to `/dashboard` if not admin

---

## 9. File Upload

- **Library**: Multer (v2)
- **Use Case**: Resume file upload during job application
- **Storage**: Local filesystem at `backend/public/uploads/`
- **Served at**: `/uploads/<filename>` (static route)
- **Route**: `POST /api/applications` (multipart/form-data)
- **Field name**: `resume`

---

## 10. Microservices Integration

Both AI-powered features are **separate services** embedded as iframes:

| Feature | URL | Integration |
|---------|-----|-------------|
| Resume Builder | `https://resumecraft-zm2k.onrender.com` | `<iframe src={serviceUrl}>` |
| Skill Quiz | `https://quiz-w0ss.onrender.com` | `<iframe src={serviceUrl}>` |

### URL Resolution Order
1. Check `VITE_RESUME_SERVICE_URL` / `VITE_QUIZ_SERVICE_URL` env var
2. Fall back to hardcoded URL in JSX

---

## 11. Email Service

- **Provider**: [Resend](https://resend.com)
- **From address**: `support@codedeck.me`
- **Trigger**: OTP verification emails on registration
- **Template**: Styled HTML email with OTP, 10-minute expiry notice

---

## 12. Deployment Setup

### Build Process
```
Render runs: npm install --prefix ../frontend && npm run build --prefix ../frontend
Then starts:  node src/index.js
```
The Express server serves `frontend/dist` as static files and handles all API routes — **single service deployment**.

### Environment Variables (Backend)
```
PORT, NODE_ENV, FRONTEND_URL
MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE, MYSQL_PORT
JWT_SECRET
ADMIN_USERNAME, ADMIN_PASSWORD
RESEND_API_KEY
EMAIL_FROM
RESUME_SERVICE_URL
QUIZ_SERVICE_URL
```

---

## 13. Key Design Decisions (Interview Talking Points)

| Decision | Rationale |
|----------|-----------|
| JWT over sessions | Stateless, works well with React SPA, no server-side session store needed |
| OTP encoded in JWT | No DB table needed for OTPs; auto-expires via JWT `expiresIn` |
| Admin in .env, not DB | Simple admin setup for single-admin system; no user management overhead |
| Microservices as iframes | AI features are independently deployable; no coupling to main app code |
| Single Render service | Express serves both API and built React — simpler infra on free tier |
| React Context for auth | Lightweight global state without Redux; sufficient for this app's scale |
| mysql2 with promise pool | Non-blocking DB queries with async/await support |
| `skillsRequired` as JSON column | Flexible schema for variable skill sets without a separate join table |
| `UNIQUE KEY (jobId, studentId)` | DB-level constraint prevents duplicate applications |
| `AUTO_INCREMENT` starts at 1000 | IDs look more professional; avoids low integers in URLs |

---

## 14. Potential Interview Questions

**Q: How does OTP verification work without storing OTPs in the database?**
> The OTP is hashed with bcrypt and embedded inside a JWT `verificationToken` (10min expiry). The user data payload is also encoded in the token. On verification, the token is decoded and the OTP is compared. If valid, the user is written to the DB — no separate OTP table needed.

**Q: How do you handle role-based access control?**
> The JWT payload contains `{ id, role, email }`. The `requireRole(['employer'])` middleware checks `req.user.role` against the allowed roles array after the `auth` middleware validates the token.

**Q: Why embed microservices as iframes instead of API calls?**
> The resume builder and quiz are standalone web apps with their own full UI. Embedding them as iframes allows complete independence — they can be built in any framework, deployed separately, and updated without touching the main app.

**Q: How does the frontend know which API URL to use in dev vs production?**
> The `AuthContext` has a self-invoking function that checks `window.location.hostname`. If it's `localhost`, it targets `localhost:5000/api`. Otherwise it uses `/api` (same-origin, since Express serves the React build).

**Q: What happens if a student tries to apply to the same job twice?**
> The `applications` table has a `UNIQUE KEY (jobId, studentId)` constraint — the database itself rejects duplicate applications at the SQL level.
