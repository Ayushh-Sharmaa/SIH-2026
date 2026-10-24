# Arena — Hackathon & Teammate Discovery Platform

> **Official Hackathon Evaluation, Teammate Matching, and Faculty Mentorship Ecosystem**    
> Maintained by **NexaSphere** at **GL Bajaj Group of Institutions, Mathura**.

Built with a high-performance, role-aware architecture on **Next.js 16 (App Router)**, **React 19**, **Clerk Authentication & JWT**, **Prisma ORM**, and **Supabase PostgreSQL**.

---

## 🌟 What's New: Open Multi-Institution & Public Discovery

* **Universal Access for All Institutions**: The platform is no longer restricted to a single college domain. Students, developers, and faculty mentors from **any university or institution** can register and participate using **personal Google accounts**, university emails, or institutional credentials.
* **Open Public Discovery (Zero-Barrier Exploration)**: Guests and prospective participants can openly explore all events, hackathon tracks, teammate directories, forming teams, and faculty mentors without needing to sign in first.
* **DPDP-Compliant Privacy & Data Masking**: Sensitive identity data (student roll numbers, academic sections, personal emails, and direct phone numbers) is dynamically masked at both the API and UI layer for unauthenticated viewers.
* **Action-Gated Authentication**: Authentication is triggered seamlessly only when a user initiates a mutation or personal action (e.g. creating/joining a team, registering for an event, sending invites, requesting faculty mentorship, or updating profile details).
* **Multi-Event Support**:
  * **Hustle Carnival 2026**: Flagship open hybrid buildathon by Club Ellusion (*"Hustle Beyond"*, Problem Statement ELU04: Student Skill & Team Finder, 1–2 member agile teams, software development & open innovation).
  * **Smart India Hackathon (SIH 2026)**: Official internal evaluation round with 6-member teams, automated female candidate reservation compliance, and the authoritative 17 SIH theme catalog.

---

## 🚀 Key Capabilities

### 1. Teammate Discovery (`/team-formation/browse-teammates`)
* **Multi-Criteria Search**: Real-time filtering across student profiles by technical skills, programming languages, soft skills, academic branch, graduation year, availability status, and institution.
* **Public Discovery Mode**: Visitors can browse candidate skillsets, project portfolios, and profiles openly.
* **Data Masking**: Roll numbers, sections, and phone contacts are protected behind DPDP privacy boundaries.
* **Bounded Pagination**: 24-result cursor and offset navigation with sub-20 KB JSON payloads.

### 2. Team Formation & Management (`/team-formation/browse-teams`)
* **Open Team Directory**: Explore forming teams, required skillsets, current member rosters, and open vacancies.
* **SIH Regulation Compliance**: Automated 1 female member reservation enforcement (when a team reaches 5 members with 0 females, seat 6 is locked exclusively for a female participant).
* **Full Team Lifecycle**: Team creation, recruitment notices, candidate invitations, join requests, roster approvals, and atomic disbanding.

### 3. Faculty Mentorship Matching (`/team-formation/browse-mentors`)
* **Verified Mentor Directory**: Search verified faculty mentors filtered by technical domain expertise, academic department, and current guidance load.
* **Mentorship Proposals**: Team leaders can send direct mentorship proposals with status tracking (`pending`, `accepted`, `declined`, `meeting_requested`).
* **Privacy Hardening**: Faculty phone numbers and internal contact details are kept strictly private from public directories.

### 4. Authoritative Hackathon Tracks & Themes (`/tracks`)
* **17 Official SIH Problem Themes**: Standardized catalog of Smart India Hackathon problem statements with instant client-side caching (`< 1ms` cache response).
* **Open Innovation Tracks**: Dedicated tracks for open innovation and buildathons like Hustle Carnival.

### 5. Role-Specific Staged Dashboards (`/dashboard`)
* **Two-Stage Fast Loading Architecture**:
  * **Stage 1 Fast Bootstrap (`/api/dashboard/bootstrap`)**: Resolves session identity, role, and completion state in `< 100ms`.
  * **Stage 2 Async Data Section (`/api/dashboard/team-details`)**: Loads assigned rosters, pending requests, and invitations in parallel without blocking initial paint.
* **Progressive Profile System**: 3 independent, lightweight mutation tiles for focused updates without full-page reloads:
  * **Student Profile**: Identity, Institution, Academic Branch/Year, Technical Skills, Track Interests.
  * **Faculty Mentor Profile**: Identity, Department, Domain Expertise, Professional Bio, and Portfolio Links.

---

## ⚡ Performance Architecture

| Optimization Layer | Implementation | Verified Benchmark |
| :--- | :--- | :---: |
| **Avatar Streaming** | Base64 strings transformed to `/api/avatar/[userId]?v=${hash}` streaming raw binary with 24h HTTP caching. | **> 99% Payload Reduction** (Teammates: 2.5 MB $\rightarrow$ 5.6 KB; Mentors: 568 KB $\rightarrow$ 0.8 KB) |
| **Search Projections** | Strict Prisma `select` DTOs with bounded `take: 24` pagination (no wildcard queries). | **< 20 KB** total JSON per 24 results |
| **Fast Bootstrap** | Compact user identity payload (439 bytes) decoupled from heavy rosters. | **< 100 ms** target load |
| **Client Caching** | Centralized `QueryClient` with in-flight request deduplication and 30s fresh TTL. | **< 1 ms** instant cache returns |
| **Zero N+1 Queries** | Compound Prisma queries using foreign-key joins in single database operations. | **1 Query** per search route |

---

## 🛡️ Security & Privacy Architecture

* **Role-Based Access Control**:
  * Public access granted for viewing discovery directories, events, and tracks.
  * `401 Unauthorized` returned for unauthenticated mutations (team formation, joins, requests).
  * `403 Forbidden` enforced for cross-role administrative attempts.
* **Universal Multi-Domain Authentication**:
  * Open registration for students and mentors across all universities and organizations.
  * Personal Google accounts and institutional emails fully supported.
* **Dynamic Data Masking (DPDP Compliant)**:
  * Public requests omit student roll numbers, section identifiers, personal emails, and phone numbers.
  * Authenticated teammates and accepted mentors receive authorized contact views.
* **Avatar Endpoint Hardening (`/api/avatar/[userId]`)**:
  * Strict identifier format validation (`RECORD_ID_REGEX`).
  * Dedicated IP rate limiting (120 req/min/IP).
  * Strict MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`), rejecting SVG/HTML to prevent XSS.
  * 500 KB maximum payload size ceiling.
  * Generic 404 responses for inactive/demo profiles to prevent enumeration oracles.
* **Cookie & Session Security**:
  * HTTP-only, `SameSite=Strict`, whole-site scoped session cookies matching JWT lifetime.

---

## 🎨 Design System: Warm Light Editorial

The platform follows a refined **Warm Light Editorial** aesthetic designed for clarity, high contrast, and academic elegance:

* **Canvas**: Warm light base (`#EFE9E1`), raised surface (`#F8F6F2`).
* **Typography**: Fluid type scale with negative tracking on headings (weight 600).
* **Color Palette**:
  * Ink / Primary Headings: `#322D29` (`text-foreground`)
  * Body Copy: `#514840` (`text-body`)
  * Accent / Active State: `#72383D` (`text-accent` / `bg-primary`)
  * Text on Accent: `#FBF7F4` (`text-on-accent`)
  * Hairline Borders: `rgba(209, 199, 189, 0.6)`
* **Accessibility**: 100% compliant with **WCAG 2.1 AA** color contrast standards.
* **Icons**: Standardized Lucide React icons with consistent stroke widths (`strokeWidth={1.75}`).

---

## 📁 Repository Structure

```
SIH-GLBGOI/
├── .github/workflows/    # CI Pipeline (Typecheck, Lint, Test, Contrast, Perf)
├── docs/                 # Architecture, Security, PRD, and Production Guides
├── prisma/               # Schema definition, migrations, and database seed scripts
│   ├── schema.prisma     # Relational models: User, Student, Mentor, Team, Membership, Invite
│   └── seed.ts           # Development seed records and demo hackathon profiles
├── public/               # Static assets, branding logos, and hackathon banners
│   ├── events/           # Event artwork (Hustle Carnival, Hackathons)
│   └── Logo/             # Institutional and Club Ellusion logos
├── scripts/              # Performance audit, diagnostic, and contrast scripts
├── src/
│   ├── app/              # Next.js 16 App Router (Pages, Layouts, API Endpoints)
│   │   ├── (auth)/       # Authentication pages (Login, Signup, Clerk OAuth)
│   │   ├── api/          # Public-safe and role-gated REST API routes
│   │   │   ├── avatar/   # Binary avatar streaming with cache busting
│   │   │   ├── dashboard/# Fast bootstrap & team details endpoints
│   │   │   ├── profile/  # Progressive student & mentor profile mutation routes
│   │   │   ├── students/ # Public-safe teammate discovery search endpoint
│   │   │   ├── mentors/  # Public-safe mentor directory search endpoint
│   │   │   ├── teams/    # Public-safe team discovery and mutation endpoint
│   │   │   └── tracks/   # Official 17 themes catalog endpoint
│   │   ├── dashboard/    # Student and Faculty Mentor dashboard views
│   │   ├── events/       # Hackathon showcase & event detail pages
│   │   ├── onboarding/   # Multi-institution role selection & profile builder
│   │   ├── team-formation/# Browse Teammates, Teams, and Mentors (Public discovery)
│   │   ├── tracks/       # 17 Official Themes directory
│   │   └── contact/      # Institutional SPOC, faculty, and coordinator contacts
│   ├── components/       # Reusable layout, navigation, modals, and design tokens
│   ├── hooks/            # Focus trapping, scroll locking, and query hooks
│   ├── lib/              # Prisma client, auth, JWT, validation, and rate limiting
│   ├── proxy.ts          # Edge route configuration & public path allowlist
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

# Clerk Authentication Credentials
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

# Seed initial hackathon records, tracks, and test profiles
npx prisma db seed
```

### 5. Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the platform in your browser.

---

## 🧪 Verification & Audit Scripts

```bash
# Run the complete test & audit verification pipeline
npm run verify

# Individual validation commands:
npm run typecheck       # TypeScript compilation check (0 errors)
npm test                # Run 119 automated unit tests across 31 suites (100% pass)
npm run test:contrast   # Audit WCAG 2.1 AA color contrast compliance
npm run audit:perf      # Automated payload, query count, and privacy audit
```

---

## 📄 License & Attribution

Developed by **NexaSphere** and **Club Ellusion** for Hackathon Operations and Student Skill & Team Matching at **GL Bajaj Group of Institutions, Mathura**, and open to participating institutions.
