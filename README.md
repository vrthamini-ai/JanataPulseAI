# JanataPulse AI

**From Citizen Voice to Verified Development Priorities**

JanataPulse AI is an AI-powered constituency development planning platform built for the **Build with AI: Code for Communities** hackathon under **Track 1: People’s Priorities**.

The platform helps MPs and constituency teams convert scattered citizen requests, local complaints, and development suggestions into **ranked, evidence-backed, and action-ready development priorities**.

---

## Team

- **Vishnukumar L H**
- **Thamini V R**

---

## Problem Statement

MPs receive development requests from public meetings, WhatsApp messages, letters, social media, grievance portals, and direct citizen representations. These inputs are usually:

- Scattered across multiple channels
- Duplicated by many citizens
- Written in different languages
- Difficult to verify
- Hard to compare with real ward-level infrastructure gaps
- Not easy to convert into objective development priorities

Because of this, important local needs may be missed, delayed, or treated as isolated complaints instead of constituency-level planning signals.

---

## Solution

**JanataPulse AI** provides a multilingual AI decision-support platform where citizens can submit local issues or development suggestions. The system uses AI to analyze, classify, verify, cluster, and rank these requests for MP offices.

The platform transforms raw citizen input into:

- AI-generated issue summaries
- Severity and urgency scores
- Ward-wise demand clusters
- Citizen verification scores
- Infrastructure gap analysis
- Development priority ranking
- MP-ready action briefs

This makes constituency planning more transparent, data-driven, and citizen-focused.

---

## Key Features

### Citizen Side

- Multilingual citizen issue submission
- Support for English, Tamil, and Hindi style inputs
- Ward and locality selection
- People affected estimate
- AI complaint analysis
- Instant triage result
- Public transparency view

### MP / Admin Side

- Secure admin login
- Constituency command dashboard
- Priority board for top development demands
- Ward-wise issue filtering
- Issue status management
- AI-generated MP briefing documents
- Development planning page
- Map-based hotspot view

### AI Decision Engine

- Gemini-powered issue understanding
- Category and sub-category detection
- Severity and urgency scoring
- Spam / fake risk estimation
- Vulnerable group impact detection
- Duplicate issue clustering
- Reality verification scoring
- Final development priority scoring

### Citizen Verification Module

- Ward residents can verify whether an issue is real
- Verification votes improve reality percentage
- Issues are marked as low confidence, needs verification, likely real, or strongly verified

---

## How It Works

```text
Citizen Submission
        ↓
Gemini AI Analysis
        ↓
Severity + Urgency + Impact Scoring
        ↓
Duplicate Clustering + Ward Verification
        ↓
Infrastructure Gap Comparison
        ↓
Final Development Priority Score
        ↓
MP Dashboard + Action Brief
```

---

## Priority Scoring Logic

JanataPulse AI does not simply display complaints. It calculates objective scores using multiple factors.

### Issue Priority Score

The issue score is calculated using:

- Severity
- Urgency
- Number of people affected
- Duplicate reports
- Vulnerable group impact
- Evidence strength
- Location confidence
- Spam risk penalty

### Final Development Priority Score

```text
Final Score =
Issue Severity Score × 0.35
+ Reality Verification Score × 0.25
+ Citizen Demand Volume × 0.20
+ Ward Infrastructure Gap × 0.15
+ Administrative Feasibility × 0.05
```

Priority levels:

- **MP Priority** — 80+
- **High** — 60 to 79
- **Medium** — 40 to 59
- **Low** — below 40

---

## Tech Stack

### Frontend

- React
- Vite
- TypeScript
- TSX
- HTML
- CSS
- Tailwind CSS
- Lucide React Icons

### Backend

- Node.js
- Express.js
- TypeScript
- JSON file-based demo storage

### AI / Google Technologies

- Google AI Studio
- Gemini API
- Google Cloud / Cloud Run ready deployment
- Firebase-ready architecture

### Other Tools

- Vite development server
- ESBuild production bundling
- dotenv for environment variables

---

## Project Structure

```text
JanataPulseAI-main/
│
├── assets/
│   └── .aistudio/
│
├── src/
│   ├── components/
│   │   ├── JanataPulseLogo.tsx
│   │   └── MapComponent.tsx
│   │
│   ├── pages/
│   │   ├── AIDevelopmentPlanPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   ├── CitizenSubmitPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── IssueDetailPage.tsx
│   │   ├── LandingPage.tsx
│   │   ├── MapViewPage.tsx
│   │   ├── PriorityBoardPage.tsx
│   │   ├── PublicTransparencyPage.tsx
│   │   ├── WardDataPage.tsx
│   │   └── WardVerificationPage.tsx
│   │
│   ├── api.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
│
├── .env.example
├── .gitignore
├── index.html
├── metadata.json
├── package.json
├── server.ts
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Getting Started

### Prerequisites

Install:

- Node.js 20 or above
- npm
- Gemini API key from Google AI Studio

---

## Installation

Clone the repository:

```bash
git clone https://github.com/your-username/JanataPulseAI.git
cd JanataPulseAI
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Add your Gemini API key in `.env`:

```env
GEMINI_API_KEY="your_gemini_api_key_here"
APP_URL="http://localhost:3000"
```

Run the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

---

## Admin Login

For demo purposes:

```text
Username: admin
Password: admin123
```

---

## Available Scripts

```bash
npm run dev
```

Runs the app in development mode.

```bash
npm run build
```

Builds the frontend and backend server for production.

```bash
npm run start
```

Starts the production server from the `dist` folder.

```bash
npm run lint
```

Runs TypeScript type checking.

```bash
npm run clean
```

Removes generated build files and demo data.

---

## API Endpoints

### Issues

```text
GET    /api/issues
GET    /api/issues/:id
POST   /api/issues
PATCH  /api/issues/:id/status
```

### AI Analysis

```text
POST   /api/analyze-complaint
POST   /api/generate-brief/:id
```

### Dashboard and Planning

```text
GET    /api/dashboard/stats
GET    /api/priorities
GET    /api/development-plan
GET    /api/hotspots
```

### Ward Data

```text
GET    /api/ward-data
GET    /api/ward-data/:ward_number
GET    /api/ward/:ward_number/issues
```

### Verification

```text
POST   /api/verify/:issue_id
GET    /api/issues/:id/verifications
```

### Admin

```text
POST   /api/admin/login
```

---

## Demo Flow

1. Open the landing page.
2. Submit a citizen issue using Tamil, Hindi, or English text.
3. Run AI analysis.
4. View severity, urgency, category, department, and priority score.
5. Login as admin.
6. Open the MP dashboard.
7. Check priority issues and ward-wise demand clusters.
8. Open the priority board.
9. Generate an MP-ready action brief.
10. View public transparency and map pages.

---

## Deployment

### Build Locally

```bash
npm run build
npm run start
```

The app runs on:

```text
http://localhost:3000
```

---

## Google Cloud Run Deployment

Build the project:

```bash
npm run build
```

Deploy using Google Cloud Run:

```bash
gcloud run deploy janatapulse-ai \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY=your_gemini_api_key_here
```

> Note: This project is configured to run on port `3000`. Make sure Cloud Run container port is also set to `3000`.

---

## Environment Variables

| Variable | Description |
|---|---|
| `GEMINI_API_KEY` | Gemini API key used for AI analysis and MP brief generation |
| `APP_URL` | Hosted app URL used for deployment configuration |

---

## Hackathon Relevance

This project directly addresses the **People’s Priorities** challenge by building a working prototype that:

- Consolidates citizen feedback
- Surfaces recurring themes
- Maps demand hotspots
- Combines citizen demand with ward infrastructure data
- Recommends and ranks high-priority development works
- Helps MP offices act faster using AI-generated briefs

---

## Impact

JanataPulse AI can help:

- MPs understand citizen needs clearly
- Constituency teams reduce manual review work
- Citizens submit issues in a simple and inclusive way
- Administrators identify high-demand wards
- Public offices prioritize development works objectively
- Local governance become more transparent and data-driven

---

## Screenshots

Add your app screenshots here before final submission:

```text
[Landing Page Screenshot]
[Citizen Submission Screenshot]
[AI Analysis Screenshot]
[MP Dashboard Screenshot]
[Priority Board Screenshot]
[Map View Screenshot]
```

---

## Future Scope

- WhatsApp Business API integration
- Voice input with Speech-to-Text
- Photo analysis using Gemini multimodal
- Integration with official ward and census datasets
- Google Maps Platform hotspot mapping
- Firebase Authentication for production users
- BigQuery-based large-scale constituency analytics
- Role-based access for MP office, ward officers, and citizens

---

## Important Note

The current demo includes sample ward and issue data for prototype demonstration. For real-world deployment, this can be replaced with official public datasets, constituency records, grievance portal data, and verified ward-level infrastructure datasets.

---

## Submission Links

Add these before submitting:

```text
Working URL: https://your-deployed-app-url.com
GitHub Repo: https://github.com/your-username/JanataPulseAI
Presentation PDF: uploaded on Hack2skill portal
```

---

## License

This project was created for hackathon demonstration and civic-tech innovation purposes. Add an open-source license before public production use.

---

## Final Line

**JanataPulse AI helps leaders listen better, decide faster, and act where citizens need them most.**
