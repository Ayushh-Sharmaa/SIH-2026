# NexaSphere — SIH 2026 Team Formation & Mentorship Platform
### Complete MVP Specification

---

## 1. Problem Statement

Every year, SIH (Smart India Hackathon) students struggle with three connected problems:
1. **Finding teammates** with complementary skills for their chosen track/problem statement.
2. **Finding a mentor** who is willing and available to guide the team.
3. **Team formation logistics** — tracking who's in, who's out, team size limits (SIH caps teams at 6 members + 2 mentors), and skill gaps.

NexaSphere solves this with one platform: a searchable directory of students and mentors, skill/track-based matching, and self-managing team formation — with profile data that auto-updates as people join, leave, or change roles.

---

## 2. User Roles

| Role | Description |
|---|---|
| **Student** | Creates a profile with skills, track interest, and team status. Can search for teammates, request to join a team, or create one. |
| **Mentor** | Creates a profile with domain expertise, track(s) they can mentor, and available capacity (e.g. max 3 teams). Teams send mentor requests. |
| **Admin (you / SIH nodal team)** | Verifies mentors, manages tracks/problem statements, monitors team formation, handles disputes/removals. |

A single login can hold only one active role at a time (chosen at signup: Student or Mentor). Role is stored on the `User` record and drives which dashboard/data model loads.

---

## 3. Site Map / Pages

```
/                          Home (what is SIH 2026, what NexaSphere does, CTA to login)
/login, /signup            Auth (role selection: Student / Mentor)
/onboarding                Role-specific profile builder (multi-step form)
/dashboard                 Personalized: student sees team status; mentor sees requests
/team-formation            Main matching hub
   /find-teammates         Filter students by skill + track, send invites
   /find-mentors           Filter mentors by track + availability, send requests
   /my-team                Current team roster, skill-gap view, chat
   /create-team             Start a new team under a track
/tracks                    List of SIH tracks/problem statements with team counts
/profile                   Edit own profile (auto-propagates to search/listings)
/notifications             Invites, requests, mentor responses, team updates
/admin                     Mentor verification, track management, reported issues
```

---

## 4. Core Data Model

```
User
 ├─ id, email, password_hash, role (student|mentor|admin), college, verified_at

StudentProfile (1:1 with User)
 ├─ user_id, name, year, branch, skills[] (tagged, e.g. "React","ML","UI/UX")
 ├─ track_interest[] (references Track)
 ├─ resume_url, github_url, linkedin_url
 ├─ team_status (open | in_team | team_full)
 ├─ team_id (nullable FK)

MentorProfile (1:1 with User)
 ├─ user_id, name, designation, organization
 ├─ expertise[] (skill/domain tags)
 ├─ tracks_supported[] (references Track)
 ├─ capacity (max teams), current_load (auto-counted)
 ├─ verified (bool, set by admin), bio, linkedin_url

Track
 ├─ id, name, problem_statement_code, description, category (Hardware/Software)

Team
 ├─ id, name, track_id, leader_id (User), status (forming | complete | locked)
 ├─ mentor_id (nullable, FK MentorProfile)
 ├─ member_count (auto, max 6), skills_covered[] (derived from members)
 ├─ skills_needed[] (derived: track requirements minus skills_covered)

TeamInvite
 ├─ id, team_id, invited_user_id, status (pending|accepted|declined), created_at

JoinRequest
 ├─ id, team_id, student_id, status (pending|accepted|declined)

MentorRequest
 ├─ id, team_id, mentor_id, status (pending|accepted|declined), message

Notification
 ├─ id, user_id, type, payload, read (bool), created_at

Message  (for in-team chat)
 ├─ id, team_id, sender_id, content, created_at
```

Key design point: **profile data is the single source of truth.** `StudentProfile.team_status`, `MentorProfile.current_load`, and `Team.skills_covered` are all derived fields recalculated on every join/leave/accept event — this is what gives you the "auto-updated on website" behavior you asked for, no manual refresh needed.

---

## 5. Team Formation Logic (the core algorithm)

1. Student sets `track_interest` + `skills` in profile.
2. `/find-teammates` filters the student pool by: same track → skill complementarity (not duplicate skills, unless the track needs depth) → college (optional filter) → availability (`team_status = open`).
3. A student can **create a team** (becomes leader) or **request to join** an existing forming team.
4. Team leader/system computes `skills_needed` = required skills for that track's problem statement minus `skills_covered` by current members. This list drives what the "looking for" banner on the team card shows.
5. Once team hits 6 members or leader locks it, `Team.status = complete`.
6. Team then browses `/find-mentors`, filtered by track + expertise + open capacity, and sends a `MentorRequest`.
7. Mentor accepts → `Team.mentor_id` set, `MentorProfile.current_load += 1`, both parties notified.
8. If a member leaves, `skills_covered` recalculates automatically and the team reopens on the teammate search until full again.

---

## 6. AI Agents (this is where Claude/LLM adds real value)

These aren't gimmicks — each agent should be a small backend service calling an LLM API (Claude via Anthropic API) with structured context, returning JSON.

| Agent | Trigger | What it does |
|---|---|---|
| **Matchmaking Agent** | Student views `/find-teammates` | Ranks candidate students beyond simple filters — considers skill complementarity, past project domains, stated interests — and returns a ranked list with a 1-line "why this match" explanation. |
| **Mentor Matching Agent** | Team requests mentor list | Ranks mentors by fit to the team's track + skill gaps + mentor's stated interest areas, not just raw filters. |
| **Skill-Gap Agent** | On every team roster change | Reads the track's problem statement description + current member skills, outputs a structured list of missing skill categories to show on the team card ("Looking for: Backend, UI/UX"). |
| **Profile Assistant** | During onboarding | Conversational helper that asks a few questions and auto-fills structured skill tags from a free-text answer like "I've built a couple of React apps and know some Python" → tags: `["React","JavaScript","Python"]`. |
| **Team Health Agent** | Periodic / on-demand from `/my-team` | Flags risks: team has no one covering a required skill, mentor capacity full elsewhere, no activity in N days — sends a notification nudge. |

All agents run as backend functions calling `POST /v1/messages` with a system prompt constraining output to JSON, so the frontend can render it directly (see the structured-output pattern in the appendix).

---

## 7. API Endpoints (MVP)

**Auth**
- `POST /api/auth/signup` — email, password, role
- `POST /api/auth/login`
- `POST /api/auth/verify-college-email` (OTP or magic link to college domain)

**Profiles**
- `GET/PUT /api/profile/student`
- `GET/PUT /api/profile/mentor`
- `POST /api/profile/upload-resume`

**Tracks**
- `GET /api/tracks`
- `GET /api/tracks/:id`

**Team Formation**
- `GET /api/students?track=&skills=&open=true` — search/filter
- `GET /api/mentors?track=&expertise=&available=true`
- `POST /api/teams` — create team
- `POST /api/teams/:id/invite`
- `POST /api/invites/:id/respond`
- `POST /api/teams/:id/join-request`
- `POST /api/join-requests/:id/respond`
- `POST /api/teams/:id/mentor-request`
- `POST /api/mentor-requests/:id/respond`
- `GET /api/teams/:id` — full roster + derived skills_covered/skills_needed

**AI Agents**
- `POST /api/agent/match-teammates` `{student_id}` → ranked list + reasons
- `POST /api/agent/match-mentors` `{team_id}` → ranked list + reasons
- `POST /api/agent/skill-gap` `{team_id}` → missing skills array
- `POST /api/agent/profile-assist` `{free_text}` → structured skill tags

**Notifications / Chat**
- `GET /api/notifications`
- `POST /api/teams/:id/messages` (or via WebSocket)

**Admin**
- `POST /api/admin/verify-mentor/:id`
- `GET /api/admin/teams` (all teams, status overview)
- `DELETE /api/admin/user/:id`

---

## 8. Integrations

| Need | Recommended service |
|---|---|
| Auth (college email verification, optional Google login) | Firebase Auth or Supabase Auth |
| Database | PostgreSQL (via Supabase or Neon) |
| Realtime (team chat, live notifications) | Socket.io, or Supabase Realtime |
| Email (invites, mentor accept, reminders) | Resend or SendGrid |
| SMS/WhatsApp alerts (optional, high engagement for Indian college students) | Twilio / WhatsApp Business API |
| File storage (resumes, ID proof for college verification) | Cloudinary or Supabase Storage |
| AI Agents | Anthropic API (Claude) — see `/mnt/skills` note below on structured JSON output |
| Hosting | Vercel (frontend + API routes) |
| Analytics | PostHog or Google Analytics |

---

## 9. Tech Stack Recommendation

- **Frontend:** Next.js (React) + Tailwind CSS
- **Backend:** Next.js API routes or a separate Node/Express service
- **Database:** PostgreSQL + Prisma ORM
- **Realtime:** Socket.io or Supabase Realtime
- **AI:** Anthropic Claude API (Sonnet class model, structured JSON output mode) for all 5 agents
- **Deployment:** Vercel (frontend/API) + Supabase (DB, auth, storage) — this combo minimizes DevOps overhead for an MVP timeline

---

## 10. MVP Build Phases

**Phase 1 — Core (Week 1–2)**
Auth, student/mentor profile creation, track listing, basic search/filter (no AI yet), team creation + join requests.

**Phase 2 — Team Formation Logic (Week 2–3)**
Skills_covered/skills_needed auto-calculation, mentor request flow, notifications.

**Phase 3 — AI Agents (Week 3–4)**
Matchmaking Agent, Mentor Matching Agent, Skill-Gap Agent — these are the differentiators, build after core flow works.

**Phase 4 — Polish (Week 4–5)**
Realtime chat, admin dashboard, mentor verification workflow, profile assistant agent, analytics.

---

## 11. Open Decisions to Nail Down Before Building

- Will mentor identities be pre-verified by SIH nodal officers (uploaded list) or self-registered + admin-approved?
- Is this single-college or multi-college/open to all SIH participants nationally?
- Team size/rules — confirm against official SIH 2026 guidelines (max team size, mentor count) since these can change year to year.
- Do you want one combined login with a role switch, or fully separate student/mentor signup flows?

---

*This is a working MVP blueprint — happy to turn any section (e.g. the Prisma schema, the exact agent system prompts, or a clickable Figma-style mockup) into a build-ready deliverable next.*
