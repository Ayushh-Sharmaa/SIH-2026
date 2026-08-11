# NexaSphere — Project Memory

**Purpose of this file:** this is the running log any AI assistant (or human) picks up first when returning to this repo after a break. It exists so work doesn't get re-guessed, re-decided, or hallucinated after a gap. Update it at the end of every work session — don't wait until "there's enough to report."

Keep entries short and factual. Newest at the top.

---

## How to use this file

- **Before starting work:** read the "Current State" and "In Progress" sections below before touching any code.
- **After finishing a work session:** add a dated entry to the log, update "Current State," update "In Progress," and update "Open Questions" if anything new came up.
- Never delete history — move old entries down, don't erase them. This file is a timeline, not just a snapshot.

---

## Current State (update this section every session)

**Phase:** Production hardening implemented in code; database migration and post-deploy timing verification are pending controlled rollout.

**What exists:**
- **Documentation (`docs/`):** All core planning docs (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`, `Security.md`, `NexaSphere_SIH2026_MVP.md`).
- **Scaffolding:** Next.js 16.2.12 (App Router, TypeScript), Tailwind CSS, Prisma ORM (`prisma/schema.prisma`), Supabase-hosted PostgreSQL, and migration/seed tooling.
- **Authentication & Auth API:**
  - Login (`/login`) & Signup (`/signup`) with role-based flow (STUDENT / MENTOR).
  - JWT session token authentication (`src/lib/auth.ts`, `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/me`).
- **Profiles & Onboarding:**
  - Multi-step onboarding experience (`/onboarding`) supporting Student profile creation (skills, languages, soft skills, URLs) and Mentor profile creation (expertise and organization, with no platform capacity limit).
  - Profile APIs (`/api/profile/student`, `/api/profile/mentor`).
- **Dashboard & Core UI:**
  - Dynamic Dashboard (`/dashboard`, `/api/dashboard`) showing student team status, leader contact info, skill coverage, and mentor pending requests.
  - Track listing (`/tracks`, `/api/tracks`).
- **Team Formation & Non-AI Matching:**
  - Team Creation page (`/team-formation/create-team`, `/api/teams`).
  - Browse Teammates page (`/team-formation/browse-teammates`, `/api/students`) with plain skill/branch/year filters.
  - Browse Mentors page (`/team-formation/browse-mentors`, `/api/mentors`, `/api/mentor-requests`) with expertise filters and minimal per-viewer eligibility data.
  - Join requests, team invites, and mentor requests (`/api/join-requests`, `/api/team-invites`, `/api/mentor-requests/[id]/respond`).
  - Notifications API (`/api/notifications`).
- **Derived Logic & Fallbacks:**
  - Automatic `skills_covered` / `skills_needed` recalculation (`src/lib/derived.ts`).
  - Immutable `TeamCodeReservation` ledger plus a non-transactional PostgreSQL sequence, so deleted public team codes are never reused.

**What does not exist yet:**
- Phase 3 AI Agents (Skill-Gap Agent, Matchmaking Agent, Mentor Matching Agent, Profile Assistant, Team Health Agent).
- Realtime team chat and webhooks remain future work; the admin dashboard exists.

---

## User Instructions Tracker & Log Entries

### Executive Summary of Instructions
1. **Instruction 1: Create initial planning & strategy documentation**
   - *Status:* **EXECUTED / COMPLETED** (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Security.md`, `Memory.md`).
2. **Instruction 2: Initialize Next.js, Prisma, Tailwind, and Supabase repo scaffolding (Phase 0)**
   - *Status:* **EXECUTED / COMPLETED** (Configured Next.js 15, Prisma schema, Tailwind CSS, `.env` structure, Supabase client).
3. **Instruction 3: Implement Authentication and Role-based Onboarding (Phase 1)**
   - *Status:* **EXECUTED / COMPLETED** (Built JWT auth routes, `/login`, `/signup`, and full `/onboarding` flow for Students & Mentors).
4. **Instruction 4: Build Core Dashboard, Team Formation, and Non-AI Matchmaking Pages/APIs (Phase 1 & Phase 2)**
   - *Status:* **EXECUTED / COMPLETED** (Built `/dashboard`, `/team-formation/*`, `/tracks`, `/api/teams`, `/api/join-requests`, `/api/mentor-requests`, `src/lib/derived.ts`, and `src/lib/mockDb.ts`).
5. **Instruction 5: Audit repository state, log instructions & executed items, and update `docs/Memory.md` regularly**
   - *Status:* **EXECUTING NOW** (Comprehensive audit complete; updating `docs/Memory.md` to reflect exact status and starting point for next session).
6. **Instruction 6: Start Phase 3 — AI Agents Integration (Skill-Gap Agent, Matchmaking Agent, etc.)**
   - *Status:* **QUEUED / NEXT TO START** (Next immediate step after memory update).

---

## Where We Need to Start From Next

1. **Deploy and verify the integrity migration:**
   - Back up and test `20260809193000_remove_mentor_capacity_and_retire_team_codes` in staging.
   - Use `prisma migrate deploy` for the controlled rollout; do not use `db push` against production.
   - Verify the immutable reservation trigger, partial unique request indexes, and mentor/team flows before collecting post-deploy timings.
2. **Phase 3 — AI Agents Implementation:**
   - **Step 1: Skill-Gap Agent (`/api/ai/skill-gap`):** Create AI endpoint using Gemini API to read track problem statement and team skills, outputting missing technical skill categories beyond raw string matching.
   - **Step 2: Matchmaking Agent (`/api/ai/match-teammates`):** Rank candidate teammates with 1-line match justifications ("why this match").
   - **Step 3: Mentor Matching Agent (`/api/ai/match-mentors`):** AI fit analysis between team track/gaps and mentor expertise.
   - **Step 4: Profile Assistant (`/api/ai/profile-helper`):** Conversational free text -> structured skill tags during onboarding.
   - **Step 5: Team Health Agent (`/api/ai/team-health`):** On-demand/periodic team risk flag calculation.
3. **Phase 4 — Polish & Admin:**
   - Realtime in-team chat (`/team/[id]/chat`).
   - Admin verification portal for mentors.

---

## In Progress

- File/area: `Production database rollout and latency verification`
  Status: Code and Prisma types are clean. Migration is intentionally not applied to production from this audit session; staging verification, deployment approval, and post-deploy measurements remain.
  Started: 2026-08-10

---

## Open Questions (mirror of PRD.md open decisions — update both together)

- Mentor verification: pre-verified list from SIH nodal officers, or self-registered + admin-approved?
- Single-college or open to all SIH 2026 participants nationally?
- Confirm the exact student team-size rule against official SIH 2026 rules. Mentor guidance has no platform-imposed maximum.
- One combined login with role switch, or fully separate signup flows?
- Final visual direction: dark-metallic vs. flat-dark palette (`Design.md` Option A vs B).
- Final accent color and motion/scroll treatment (pending Figma/Stitch prototyping).

---

## Session Log

### 2026-08-10 — Production latency, mentor, and team-integrity audit
- Audited all shipped TypeScript/TSX/CSS, routes, authentication/session flows, Prisma models/migrations, CI, tests, configuration, and relevant Next.js 16 documentation. The repository has `.agents`, not `.agent`; applicable project and audit guidance was read before edits.
- Removed duplicate post-login `/api/auth/me` calls. Login/signup now hydrate the shared session from the mutation response and navigate without waiting for unrelated dashboard data.
- Removed the mentor page's `/api/auth/me` → full `/api/dashboard` waterfall. `/api/mentors` returns cached directory data and a minimal uncached eligibility projection in parallel.
- Removed `MentorProfile.capacity` and `currentLoad` across schema, APIs, UI, validation, tests, and docs. Guidance count is derived from `Team.mentorId`; mentor accepts are conditional and race-safe.
- Added immutable `TeamCodeReservation` rows, a permanent database trigger, and partial unique indexes for active mentor/join/invite requests. Team code allocation and team creation share a transaction while the sequence permanently burns failed allocations.
- Guarded concurrent mentor, join, and invite acceptance with conditional claims and transactions; fixed leadership-role transfer and roster count/status updates; queued non-critical notifications with Next.js `after()`.
- Reduced request waterfalls: team filters no longer fetch on each keystroke, notification/admin/statistics queries fan out in parallel, dashboard histories are bounded, and available-student filtering runs in PostgreSQL.
- Verification so far: `prisma format`, `prisma generate`, `next typegen`, and `npm run typecheck` pass. Production migration was not executed.

### 2026-08-03 — Integrated Clerk Authentication with Google Sign-In
- Installed `@clerk/nextjs` package and configured `.env.local` with live Clerk keys (`crucial-lizard-75.clerk.accounts.dev`).
- Wrapped root layout (`src/app/layout.tsx`) with `<ClerkProvider>`.
- Configured route protection via `src/middleware.ts` with `clerkMiddleware()` supporting both Clerk sessions and custom JWT auth session cookies (`token`).
- Added styled "Continue with Google" & "Sign up with Google" OAuth buttons on `/login` and `/signup`.
- Created sync endpoint `src/app/api/auth/clerk-sync/route.ts` with GET & POST handlers to process Clerk OAuth browser redirects, sync authenticated Google users into Prisma / MockDb records, and automatically redirect to `/dashboard` or `/onboarding`.

### 2026-08-03 — Onboarding & Auth Redirect Fixes + Strict Validation
- Fixed login/onboarding redirect bug in `src/lib/mockDb.ts` by hydrating `studentProfile` & `mentorProfile` on `user.findUnique`.
- Overhauled onboarding form (`src/app/onboarding/page.tsx`):
  - Removed preset emoji avatar buttons and made profile photo upload strictly mandatory with live showcase preview.
  - Restricted academic branch options strictly to `['CSE', 'CSE (AI/ML)', 'CS']`.
  - Removed default pre-filled input values (`User`, `3rd Year`, `CSE`), requiring explicit user input.
  - Enforced strict mandatory field validations across all steps (Academic, Skills/Fluency, Preferences/Links) before advancing or submitting.
- Verified compilation cleanly via `npm run build`.

### 2026-08-03 — Comprehensive Repo Audit & Phase 1/2 Completion Logged in Memory.md
- Performed complete repository audit of committed code (63 files, 13k+ lines of code added).
- Verified full completion of Phase 0 (Setup) and Phase 1/Phase 2 Core features:
  - Auth system (`/login`, `/signup`, JWT HttpOnly cookies).
  - Multi-step Onboarding (`/onboarding`).
  - Dashboard (`/dashboard`) & Track listing (`/tracks`).
  - Team creation (`/team-formation/create-team`), teammate finding (`/team-formation/find-teammates`), mentor finding (`/team-formation/find-mentors`).
  - Full API suite (`/api/auth/*`, `/api/profile/*`, `/api/teams/*`, `/api/join-requests`, `/api/mentor-requests`, `/api/notifications`).
  - Derived skills calculation (`src/lib/derived.ts`) and mock database fallback (`src/lib/mockDb.ts`).
- Updated `docs/Memory.md` with explicit instruction execution tracker, current status, and clear entry point for Phase 3 (AI Agents).

### 2026-08-03 — Phase 1 & Phase 2 1st Draft Committed ("1st draft of the dashboard")
- Scaffolded Next.js 15 app with Tailwind CSS, Prisma Schema (`prisma/schema.prisma`), and Supabase config.
- Implemented core auth, onboarding, team creation, teammate/mentor discovery, and dashboard views.
- Created fallback mock DB (`src/lib/mockDb.ts`, `src/lib/db.json`).

### 2026-08-02 — Security.md added
- Created `Security.md`: recurring security checkup cadence, per-route rate limiting table, suspicious signup/activity flagging signals, and skeleton-loading/resilience strategy for slow-loading or high-latency pages.
- Added cross-reference from `Rules.md` to `Security.md`.

### 2026-08-02 — Planning docs created
- Created all six planning docs (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`) from the original MVP spec (`NexaSphere_SIH2026_MVP.md`).

