# NexaSphere — Architecture

---

## 1. App Flow

```
Visitor lands on "/"
   │
   ▼
Signup/Login  ──►  choose role: Student or Mentor
   │
   ▼
Onboarding (multi-step profile builder)
   │  Student: skills, track interest, resume/GitHub/LinkedIn
   │  Mentor: expertise, tracks supported, verification, bio
   ▼
Dashboard (role-specific)
   │  Student → team status / recommendations
   │  Mentor  → incoming requests / current teams
   ▼
Team Formation Hub
   ├── find-teammates  (filter + AI-ranked matches → send invite)
   ├── find-mentors    (filter + AI-ranked matches → send request)
   ├── create-team     (become leader, pick track)
   └── my-team         (roster, skill-gap view, chat)
   │
   ▼
Notifications drive every state change:
   invite sent → accepted/declined → team roster updates
   → skills_covered/skills_needed recalculated
   → mentor request sent → accepted → team locked
```

**Core principle:** profile and relationship data are the source of truth. Derived fields (`team_status`, `skills_covered`, `skills_needed`) are recalculated on roster changes server-side. A mentor's guidance count is derived from `Team.mentor_id`; it is never stored as a mutable load counter.

---

## 2. High-Level System Architecture

```
┌─────────────────────────────┐
│        Next.js Frontend      │
│  (React + Tailwind, App Dir) │
└──────────────┬───────────────┘
               │ REST calls
               ▼
┌─────────────────────────────┐
│     Next.js API Routes       │
│  (auth, profiles, teams,     │
│   tracks, notifications)     │
└──────┬───────────────┬───────┘
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────────┐
│ PostgreSQL   │  │  AI Agent Service     │
│ (via Prisma) │  │  (calls Claude API,   │
│ Supabase DB  │  │  structured JSON out) │
└─────────────┘  └──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Supabase Auth / Storage /   │
│  Realtime (chat, live notifs)│
└─────────────────────────────┘
```

---

## 3. Folder & File Structure

```
nexasphere/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── onboarding/page.tsx
│   ├── dashboard/page.tsx
│   ├── team-formation/
│   │   ├── find-teammates/page.tsx
│   │   ├── find-mentors/page.tsx
│   │   ├── my-team/page.tsx
│   │   └── create-team/page.tsx
│   ├── tracks/page.tsx
│   ├── profile/page.tsx
│   ├── notifications/page.tsx
│   ├── admin/page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup/route.ts
│   │   │   ├── login/route.ts
│   │   │   └── verify-college-email/route.ts
│   │   ├── profile/
│   │   │   ├── student/route.ts
│   │   │   ├── mentor/route.ts
│   │   │   └── upload-resume/route.ts
│   │   ├── tracks/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── students/route.ts
│   │   ├── mentors/route.ts
│   │   ├── teams/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── invite/route.ts
│   │   │       ├── join-request/route.ts
│   │   │       ├── mentor-request/route.ts
│   │   │       └── messages/route.ts
│   │   ├── invites/[id]/respond/route.ts
│   │   ├── join-requests/[id]/respond/route.ts
│   │   ├── mentor-requests/[id]/respond/route.ts
│   │   ├── agent/
│   │   │   ├── match-teammates/route.ts
│   │   │   ├── match-mentors/route.ts
│   │   │   ├── skill-gap/route.ts
│   │   │   └── profile-assist/route.ts
│   │   ├── notifications/route.ts
│   │   └── admin/
│   │       ├── verify-mentor/[id]/route.ts
│   │       ├── teams/route.ts
│   │       └── user/[id]/route.ts
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/              # shared, reusable primitives (button, card, input, badge)
│   ├── profile/          # profile forms, skill-tag input
│   ├── team/              # team card, roster list, skill-gap banner
│   ├── mentor/            # mentor card, verification and guidance count
│   └── layout/           # navbar, sidebar, notification bell
├── lib/
│   ├── prisma.ts          # Prisma client singleton
│   ├── supabase.ts        # Supabase client (auth/storage/realtime)
│   ├── claude.ts          # Anthropic API wrapper for agents
│   └── derived.ts         # skills_covered / skills_needed / member_count logic
├── prisma/
│   └── schema.prisma
├── types/
│   └── index.ts
├── docs/                  # PRD.md, Architecture.md, Rules.md, Phases.md, Design.md, Memory.md
├── public/
├── .env.local
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 4. Data Model

```
User
 ├─ id, email, password_hash, role (student|mentor|admin), college, verified_at

StudentProfile (1:1 with User)
 ├─ user_id, name, year, branch, skills[]
 ├─ track_interest[] (references Track)
 ├─ resume_url, github_url, linkedin_url
 ├─ team_status (open | in_team | team_full)
 ├─ team_id (nullable FK)

MentorProfile (1:1 with User)
 ├─ user_id, name, designation, organization
 ├─ expertise[], tracks_supported[]
 ├─ guided teams (derived from Team.mentor_id; no platform maximum)
 ├─ verified (bool), bio, linkedin_url

Track
 ├─ id, name, problem_statement_code, description, category

Team
 ├─ id, team_code, name, track_id, leader_id, status (forming|complete|locked)
 ├─ mentor_id (nullable)
 ├─ member_count (auto, max 6)
 ├─ skills_covered[], skills_needed[] (derived)

TeamCodeReservation
 ├─ code (immutable primary key), allocated_at
 └─ survives Team deletion so public SIH codes are permanently retired

TeamInvite      ├─ id, team_id, invited_user_id, status, created_at
JoinRequest     ├─ id, team_id, student_id, status
MentorRequest   ├─ id, team_id, mentor_id, status, message
Notification    ├─ id, user_id, type, payload, read, created_at
Message         ├─ id, team_id, sender_id, content, created_at
```

---

## 5. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind CSS | Fast MVP iteration, SSR where useful, one deploy target with the API |
| Backend | Next.js API routes (Node) | No separate service to stand up for MVP scope |
| Database | PostgreSQL + Prisma ORM | Relational data (users, teams, requests) fits SQL naturally; Prisma gives type-safe queries |
| Auth | Supabase Auth (or Firebase Auth) | College-email verification + optional Google login out of the box |
| Realtime | Supabase Realtime or Socket.io | Team chat, live notification updates |
| File storage | Supabase Storage (or Cloudinary) | Resumes, ID proof for college verification |
| AI | Anthropic Claude API, structured JSON output | Powers all 5 agents (matchmaking, mentor matching, skill-gap, profile assist, team health) |
| Email | Resend or SendGrid | Invite, mentor-accept, reminder emails |
| Hosting | Vercel | Native Next.js deploy, zero DevOps overhead for MVP timeline |
| Analytics | PostHog or Google Analytics | Usage tracking post-launch |

This combo (Vercel + Supabase + Prisma) minimizes DevOps overhead so the team can focus on the matching logic and AI agents, which are the actual differentiators.
