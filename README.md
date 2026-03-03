# CareerCraft

A comprehensive web-based platform bridging the gap between students and top employers. 

**Live Demo:** [CareerCraft on Railway](https://careercraft-production-32b2.up.railway.app/)

---

## Key Features

- **Student Dashboard:** Track job applications, browse available listings, and take quizzes based on core skills.
- **Employer Dashboard:** Create, post, and effortlessly manage job openings alongside real-time application statistics.
- **Institute Administrator:** Custom portal to oversee ecosystem statistics and user demographics.
- **AI Resume Generator:** Dedicated engine for parsing student experiences and strictly formatting an ATS-compliant `.docx` document ready for direct application.
- **Top Companies & Opportunities:** Browse premium companies and access career guidance metrics.

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (Lightweight & zero dependencies)
- **Backend Architecture:** Node.js with Express.js REST API
- **Database:** MySQL relational mapping
- **Authentication:** Custom JWT-based security alongside standard login structures
- **AI Integrations:** Google Gemini (`gemini-2.5-flash`) structured generation prompts
- **Document Rendering:** Next-gen declarative `.docx` rendering with custom parsing rules

---

## Getting Started

### 1. Clone the repo
```bash
git clone <your-repo-link>
cd CareerCraft
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure the environment
Create a `.env` file in the root directory following the parameters of your MySQL instance, Email provider, and Gemini API Key:
```env
# Database configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_db_password
DB_NAME=careercraft

# JSON Web Token Secret
JWT_SECRET=your_jwt_secret

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Email Sending Agent
EMAIL_USER=your_email_address
EMAIL_PASS=your_app_password

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 4. Launch the platform
```bash
npm start
```
The server listens by default on `http://localhost:5000`.
