# NexaSphere — Product Requirements Document
### SIH 2026 Team Formation & Mentorship Platform

---

## 1. What We're Building

NexaSphere is a web platform that solves the three recurring pain points every SIH (Smart India Hackathon) student runs into every year:

1. **Finding teammates** with complementary skills for a chosen track/problem statement.
2. **Finding a mentor** who is willing and available to guide the team.
3. **Team formation logistics** — tracking who's in, who's out, team size limits (max 6 members + up to 2 mentors), and skill gaps.

The platform is a searchable directory of students and mentors, with skill/track-based matching and self-managing team formation. Profile data is the single source of truth — team rosters, skill coverage, and mentor load all auto-update as people join, leave, or change roles, with no manual refresh needed.

**In one sentence:** NexaSphere turns "who do I even ask to be on my team?" into a structured, searchable, self-updating process.

---

## 2. Targeted Users

| User | Who they are | What they need from the platform |
|---|---|---|
| **Student** | An SIH participant looking for a team, or already leading/in one | Discover teammates with complementary skills, join or create a team, see what skills their team is still missing |
| **Mentor** | Faculty, industry professional, or senior student willing to guide teams | Discover teams that match their expertise, manage how many teams they can take on, respond to requests |
| **Admin (SIH nodal team / Tanishk)** | Verifies mentors, manages tracks, oversees the process | Confirm mentor identities, manage the list of tracks/problem statements, monitor team formation health, resolve disputes |

A single login holds exactly one active role (Student or Mentor), chosen at signup. Role determines which dashboard and data model loads.

---

## 3. Core Features

### 3.1 Profiles
- Student profile: skills (tagged), track interest, year/branch, resume/GitHub/LinkedIn links, live team status.
- Mentor profile: expertise tags, tracks supported, verification status, and a guidance count derived from assigned teams. There is no platform-imposed mentor limit.
- Profile edits auto-propagate to search results and listings — no separate "publish" step.

### 3.2 Team Formation
- `/find-teammates`: filter students by track, skill, college, and open availability; send invites.
- `/team-formation/browse-mentors`: filter verified mentors by track and expertise; send requests.
- Create a team (become leader) or request to join an existing forming team.
- Auto-computed `skills_needed` per team: track's required skills minus what current members already cover. Drives a "Looking for: Backend, UI/UX" banner on the team card.
- Team locks at 6 members or when the leader manually locks it.
- If a member leaves, skill coverage recalculates and the team automatically reopens to new matches.

### 3.3 Mentor Matching
- Teams browse and request verified mentors filtered by track and expertise.
- Mentor acceptance atomically claims an unassigned team. A mentor may accept any number of teams; the visible guidance count is derived from assignments.
- Both parties get notified on accept/decline.

### 3.4 AI Agents (Claude-powered)
| Agent | Trigger | Value |
|---|---|---|
| Matchmaking Agent | Student views `/find-teammates` | Ranks candidates beyond raw filters — skill complementarity, past project domains, stated interests — with a 1-line "why this match." |
| Mentor Matching Agent | Team requests mentor list | Ranks mentors by fit to track + skill gaps + mentor's stated interest areas. |
| Skill-Gap Agent | Every team roster change | Reads the track's problem statement + current member skills, returns missing skill categories for the team card. |
| Profile Assistant | Onboarding | Converts free-text ("I've built a couple of React apps and know some Python") into structured skill tags. |
| Team Health Agent | Periodic / on-demand | Flags risk: uncovered required skill, no assigned mentor, no team activity in N days. |

### 3.5 Supporting Features
- Notifications: invites, join requests, mentor responses, team updates.
- In-team chat (real-time messaging per team).
- Track listing with live team counts per track.
- Admin dashboard: mentor verification, track management, reported issues, user removal.

---

## 4. Out of Scope (for MVP)

- Multi-hackathon support beyond SIH 2026 (single-event focus for now).
- Native mobile apps (web-first, responsive).
- Payment/monetization of any kind.
- Public API for third-party integrations.

---

## 5. Open Decisions (must be resolved before build)

- Will mentor identities be pre-verified from an SIH nodal officer list, or self-registered + admin-approved?
- Is this single-college or open to all SIH 2026 participants nationally?
- Confirm exact team size / mentor count limits against official SIH 2026 guidelines (these can shift year to year).
- One combined login with a role switch, or fully separate student/mentor signup flows?

---

## 6. Success Criteria for MVP

- A student can go from signup → complete profile → find and join (or form) a full team → send a mentor request, entirely without manual admin intervention.
- Team skill coverage and "looking for" banners stay accurate automatically as rosters change.
- At least the Matchmaking Agent and Skill-Gap Agent are live and returning useful, non-generic output.
