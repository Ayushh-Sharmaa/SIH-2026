# ARENA — Student Skill and Team Finder (Problem Statement ELU04)

> **Event:** Hustle Carnival 2026 &bull; Ellusion Buildathon  
> **Problem Statement ID:** ELU04  
> **Problem Statement Title:** Student Skill and Team Finder  
> **Theme:** Education & Student Networking  
> **PS Category:** Software  
> **Team Name:** Team Ghost  
> **Host Institution:** GL Bajaj Group of Institutions, Mathura  
> **Developed & Maintained by:** NexaSphere

Built on **Next.js 16**, **React 19**, **Clerk Authentication**, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## 🎯 Executive Summary & Proposed Solution

Standard hackathon platforms act merely as static recruitment boards or global aggregates. **Arena** is a multi-tenant, rule-aware campus platform specifically architected to solve the cold-start and collaboration frictions in academic institutions:

* **Org-First Onboarding**: Colleges list events as public or private with isolated talent pools.
* **Access-Code Sign-Up**: Students enter their college access code to participate in their institution's events.
* **3-Tile Progressive Profiles**: Clean, low-friction setup capturing Identity & Academics, Technical & Soft Skills, and Track Interests.
* **Rule-Aware Team Formation**: Automatically enforces hackathon limits and regulations (including locking the 6th seat exclusively for a female member when a team has 5 members and 0 females).
* **Live Skill-Gap Banners**: Teams see exactly what roles are missing on their roster in real time.
* **Integrated Faculty Mentorship Layer**: Verified faculty mentors categorized by domain expertise with transparent guidance capacity tracking.
* **Privacy by Design**: Student roll numbers and phone numbers are strictly masked in public discovery (designed in alignment with DPDP Act principles).

---

## 🔄 Platform Flow

1. **List Events**: Colleges post public or private hackathons with isolated access codes.
2. **Join via Code**: Students enter their college code to view their institution's event workspace.
3. **Build Profile**: Students showcase their technical stack, branch, year, and interests across 3 progressive tiles.
4. **Form a Team**: Discover peers, spot missing skill gaps with live banners, send invites, and track join requests.
5. **Get a Mentor**: Team leaders browse verified faculty mentors by domain expertise and send mentorship requests.

---

## ⚡ Technical Approach & Architecture

### 1. Client Layer
* **Next.js 16 App Router** with React 19 and React Compiler enabled.
* **Role-Aware Dashboards**: Stage 1 Fast Bootstrap resolves identity in `< 100ms`, while heavy rosters stream in Stage 2.
* **Motion & Feel**: GSAP motion hooks, Lenis smooth scrolling, and Framer Motion transitions adhering to the **Warm Light Editorial** design system.

### 2. API & Security Layer
* **Rate-Limited REST Endpoints**: 120 req/min sliding-window IP rate limiting.
* **401 / 403 Role Gateways**: Unauthenticated requests are rejected with 401; cross-role privilege escalations return 403.
* **Binary Avatar Streaming (`/api/avatar/[userId]`)**: Raw binary streaming with 24-hour HTTP cache headers, reducing discovery payloads by **> 99%** (2.5 MB $\rightarrow$ 5.6 KB).
* **DPDP Act Privacy Guard**: Student roll numbers and mobile contact numbers are never exposed in public search DTO projections.

### 3. Data & Database Layer
* **Prisma ORM 6.19** with **Supabase PostgreSQL**.
* **Zero N+1 Queries**: Single compound join query per search route.
* **Bounded Pagination**: Strict 24-row limits prevent memory exhaustion.
* **Immutable Code Reservations**: Team codes are reserved in an immutable ledger to prevent collisions or re-use.

---

## 📊 Empirical Benchmarks

| Metric | Target / Specification | Verified Value |
| :--- | :--- | :---: |
| **Discovery Payload Reduction** | > 95% reduction vs raw base64 | **> 99.7%** (2.5 MB $\rightarrow$ 5.6 KB) |
| **Dashboard Bootstrap** | Fast user identity resolution | **< 100 ms** (439-byte payload) |
| **Automated Unit Tests** | Zero regressions across all flows | **69 / 69 passing** (17 suites) |
| **WCAG 2.1 AA Contrast** | All color token combinations | **100% compliant** |
| **Search Route Query Count** | Avoid N+1 relation queries | **1 query** per search route |

---

## 🥊 Competitive Advantage (Existing Solutions vs. Arena)

| Feature / Parameter | Devfolio | HackerEarth | Unstop | LinkedIn | Arena (Our Platform) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Colleges create & manage own events** | ❌ | ❌ | ❌ | ❌ | **✅ Yes** |
| **Access-code based private college events** | ❌ | ❌ | ❌ | ❌ | **✅ Yes** |
| **Student skill profiles with tech stack** | ✅ | ✅ | ✅ | ✅ | **✅ Yes** |
| **Team formation within events** | ✅ | ✅ | ✅ | ❌ | **✅ Yes** |
| **Integrated faculty mentorship network** | ❌ | ❌ | Partial | ❌ | **✅ Yes** |
| **Role-wise dashboards (student, mentor, admin)** | ❌ | ❌ | ❌ | ❌ | **✅ Yes** |
| **Event visibility controls (public / private)** | ❌ | ❌ | ❌ | ❌ | **✅ Yes** |
| **Campus-focused B2B platform** | ❌ | ❌ | Partial | ❌ | **✅ Yes** |
| **Student-to-mentor connection & load tracking** | ❌ | ❌ | Partial | ✅ | **✅ Yes** |

---

## 🗺️ Future Roadmap

* **Claude-Powered Matchmaking**: Intelligent matchmaking agent pairing students based on complementary GitHub repos and project interests.
* **AI Skill-Gap Diagnostics**: Autonomous advisory highlighting exact missing dependencies and architectural bottlenecks in team rosters.
* **AI Profile Assistant**: Auto-generating student portfolio summaries from resumes and code repositories.

---

## 📁 Repository Structure

```
SIH-GLBGOI/
├── docs/                 # Architecture, Security, PRD, and Production Guides
├── prisma/               # Schema definition and database seed scripts
├── public/
│   └── Logo/             # Updated NexaSphere and GL Bajaj branding assets
├── scripts/              # Performance audit, diagnostic, and contrast scripts
├── src/
│   ├── app/              # Next.js App Router (Pages, Layouts, API Routes)
│   │   ├── api/          # 15 rate-limited REST JSON Endpoints
│   │   ├── dashboard/    # Student and Faculty Mentor staged dashboard views
│   │   ├── events/       # Hustle Carnival 2026 & SIH Internal event arenas
│   │   ├── onboarding/   # 3-step progressive onboarding
│   │   ├── team-formation/# Browse Teammates, Teams, and Mentors
│   │   └── tracks/       # 17 Official Themes & ELU04 problem statements
│   ├── components/       # Reusable layout, modal, motion, and UI elements
│   ├── lib/              # Prisma client, auth, rate limiting, and avatar utils
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

### 3. Install & Seed
```bash
npm install
npx prisma generate
npx prisma db seed
npm run dev
```

Open `http://localhost:3000` to view the platform.

---

## 📄 License
Proprietary platform built for **Hustle Carnival 2026 (Problem Statement ELU04)** and campus hackathons at **GL Bajaj Group of Institutions, Mathura**. Maintained by **Team Ghost & NexaSphere**.
