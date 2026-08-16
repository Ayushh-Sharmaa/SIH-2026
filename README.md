# SIH@GLBGOI — Smart India Hackathon Platform

The official **SIH Internal Evaluation, Team Formation, and Faculty Mentorship Platform** for **GL Bajaj Group of Institutions, Mathura**, developed and maintained by **NexaSphere**.

Built with a high-performance, role-aware architecture on **Next.js 16**, **React 19**, **Clerk Authentication**, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## 🚀 Key Capabilities

### 1. Teammate Discovery (`/team-formation/browse-teammates`)
* Database-side filtered search across student profiles by skills, languages, soft skills, branch, year, and team availability status.
* Bounded 24-result pagination with cursor-based and offset navigation.
* Privacy-hardened DTOs: roll numbers and mobile contact details are strictly masked in public discovery.

### 2. Team Formation & Management (`/team-formation/browse-teams`)
* Explore open forming teams, review real-time member rosters, skill coverage, and missing skills.
* SIH Regulation Compliance: Automatic 1 female member reservation enforcement (when a team reaches 5 members with 0 females, the 6th seat is locked exclusively for a female candidate).
* Full team lifecycle: creation, recruitment notices, invitations, join requests, and atomic disbanding.

### 3. Faculty Mentorship Matching (`/team-formation/browse-mentors`)
* Search verified faculty mentors filtered by domain expertise, department, and current guidance load.
* Direct mentorship requests from team leaders with status tracking (`pending`, `accepted`, `declined`, `meeting_requested`).
* Strict privacy: Faculty phone contacts are excluded from public search directories.

### 4. Role-Specific Staged Dashboards (`/dashboard`)
* **Two-Stage Loading**:
  * **Stage 1 Fast Bootstrap (`/api/dashboard/bootstrap`)**: Resolves identity, role, and completion state in `< 100ms`.
  * **Stage 2 Async Data Section (`/api/dashboard/team-details`)**: Loads assigned rosters, pending requests, and invitations in parallel.
* **Progressive Profile System**: 3 independent, lightweight mutation tiles for focused updates without full-page reloads.
  * Student: Identity & Academic, Technical Skills, Track & Hackathon Interests.
  * Faculty Mentor: Identity & Department, Domain Expertise, Professional Bio & Links.

### 5. Authoritative 17 SIH Themes (`/tracks`)
* Enforces the official 17 Smart India Hackathon themes catalog with instant client-side caching (`0.03ms` response).

---

## ⚡ Performance Architecture

| Optimization Layer | Implementation | Verified Benchmark |
| :--- | :--- | :---: |
| **Avatar Streaming** | Base64 strings transformed to `/api/avatar/[userId]?v=${hash}` streaming raw binary with 24h HTTP caching. | **> 99% Payload Reduction** (Teammates: 2.5 MB $\rightarrow$ 5.6 KB; Mentors: 568 KB $\rightarrow$ 0.8 KB) |
| **Search Projections** | Strict `select` DTOs with bounded `take: 24` pagination (no `select *`). | **< 20 KB** total JSON per 24 results |
| **Fast Bootstrap** | Compact user identity payload (439 bytes) decoupled from heavy rosters. | **< 100 ms** target load |
| **Client Caching** | Centralized `QueryClient` with in-flight request deduplication and 30s fresh TTL. | **< 1 ms** instant cache returns |
| **Zero N+1 Queries** | Compound Prisma queries using foreign-key joins in single database operations. | **1 Query** per search route |

---

## 🛡️ Security & Privacy Architecture

* **Role-Based Authorization**: Returns `401 Unauthorized` for missing/invalid tokens and `403 Forbidden` for cross-role attempts.
* **Avatar Endpoint Hardening (`/api/avatar/[userId]`)**:
  * Identifier format validation (`RECORD_ID_REGEX`).
  * Dedicated IP rate limiting (120 req/min/IP).
  * Strict MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), rejecting SVG/HTML to prevent XSS.
  * 500 KB maximum payload size ceiling.
  * Generic 404 responses for inactive/demo profiles to prevent enumeration oracles.
* **Sensitive Data Masking**: Phone numbers and student roll numbers are excluded from public search directories and prospective mentorship inquiries.
* **Clerk OAuth Bridge**: Domain-restricted to official `@glbajajgroup.org` workspace accounts.

---

## 📁 Repository Structure

```
SIH-GLBGOI/
├── .github/workflows/    # CI Pipeline (Typecheck, Lint, Test, Contrast, Perf)
├── docs/                 # Architecture, Security, PRD, and Production Guides
├── prisma/               # Schema definition and database seed scripts
├── public/               # Static assets, branding, and hackathon banners
├── scripts/              # Performance audit, diagnostic, and contrast scripts
├── src/
│   ├── app/              # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/          # Rate-limited REST JSON Endpoints & Avatar streamer
│   │   │   ├── avatar/   # Binary avatar streaming with cache busting
│   │   │   ├── dashboard/# Staged bootstrap & team details endpoints
│   │   │   ├── profile/  # Progressive profile mutation endpoints
│   │   │   ├── students/ # Teammate discovery search endpoint
│   │   │   ├── mentors/  # Mentor directory search endpoint
│   │   │   ├── teams/    # Team discovery and management endpoint
│   │   │   └── tracks/   # Official 17 themes catalog endpoint
│   │   ├── dashboard/    # Student and Faculty Mentor dashboard views
│   │   ├── onboarding/   # User role selection and profile builder
│   │   ├── team-formation/# Browse Teammates, Teams, and Mentors
│   │   └── tracks/       # 17 Official Themes directory
│   ├── components/       # Reusable layout, modal, motion, and UI elements
│   ├── hooks/            # Focus trapping, scroll locking, and GSAP hooks
│   ├── lib/              # Prisma client, auth, validation, rate limiting, and avatar utils
│   └── styles/           # Warm Light Editorial design tokens and typography
└── tests/                # Automated unit tests, session specs, and performance assertions
```

---

## ⚙️ Development Setup

### 1. Prerequisites
* [Node.js (v20+)](https://nodejs.org/)
* [npm](https://www.npmjs.com/)

### 2. Environment Configuration
Create a `.env` file in the root directory:

```bash
# Database URL (Supabase PostgreSQL Connection String)
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres?pgbouncer=true"

# JWT Authentication Secret (Minimum 32 characters)
NEXTAUTH_SECRET="your-super-secure-jwt-signing-secret"

# Clerk Credentials
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seeding
```bash
# Push schema changes to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed initial hackathon records and test profiles
npx prisma db seed
```

### 5. Running Locally
```bash
npm run dev
```
Open `http://localhost:3000` to view the platform.

---

## 🧪 Verification & Audit Scripts

```bash
# Run the complete test & audit verification pipeline
npm run verify

# Individual validation commands:
npm run typecheck       # TypeScript compilation check (0 errors)
npm test                # Run 69 automated unit tests across 17 suites
npm run test:contrast   # Audit WCAG 2.1 AA colour contrast compliance
npm run audit:perf      # Automated payload, query count, and privacy audit
```

---

## 📄 License
Proprietary platform built for Internal Hackathon Operations at **GL Bajaj Group of Institutions, Mathura**. Maintained by **NexaSphere**.
