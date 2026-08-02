# NexaSphere — Build Phases

Each phase should be functionally usable end-to-end before moving to the next — avoid building AI agents on top of a team-formation flow that isn't solid yet.

---

## Phase 0 — Setup (pre-Week 1)

- Repo scaffolding: Next.js + Tailwind + Prisma + Supabase wired together.
- `.env.local` structure defined (no real secrets committed).
- Prisma schema drafted from the data model in `Architecture.md` and first migration run.
- `docs/` folder in place with all six planning docs.

**Exit criteria:** app boots locally, connects to a Supabase Postgres instance, schema is migrated.

---

## Phase 1 — Core (Week 1–2)

- Auth: signup/login, role selection (Student/Mentor), college-email verification.
- Student profile creation/edit (skills, track interest, resume/GitHub/LinkedIn).
- Mentor profile creation/edit (expertise, tracks supported, capacity, bio).
- Track listing page (`/tracks`) with basic team counts.
- Basic search/filter on `/find-teammates` and `/find-mentors` — **no AI yet**, plain filter logic only.
- Team creation + join requests (no skill-gap calculation yet).

**Exit criteria:** a student can sign up, build a profile, create or join a team via plain filters, and a mentor can sign up and build a profile.

---

## Phase 2 — Team Formation Logic (Week 2–3)

- `skills_covered` / `skills_needed` auto-calculation (`lib/derived.ts`), recalculated on every roster change.
- Mentor request flow: team → mentor request → accept/decline → `current_load` updates.
- Notifications system: invites, join requests, mentor responses, team updates.
- Team locking at 6 members or manual lock by leader.
- Team reopening logic when a member leaves.

**Exit criteria:** the full non-AI team-and-mentor lifecycle works end-to-end and derived fields stay accurate automatically.

---

## Phase 3 — AI Agents (Week 3–4)

Build in this order, since each depends on stable data from earlier phases:

1. **Skill-Gap Agent** — reads track problem statement + member skills, outputs missing categories (replaces/enhances the plain Phase 2 calculation with LLM judgment on nuanced gaps).
2. **Matchmaking Agent** — ranks candidate students beyond filters, with a 1-line "why this match."
3. **Mentor Matching Agent** — ranks mentors by fit to track + skill gaps + stated interests.
4. **Profile Assistant** — conversational onboarding helper, free text → structured skill tags.
5. **Team Health Agent** — periodic/on-demand risk flags (uncovered skill, mentor overloaded, inactivity).

Each agent ships behind a graceful fallback per `Rules.md` (feature still works with plain filters if the agent call fails).

**Exit criteria:** all 5 agents live, returning structured JSON the frontend renders directly, with fallbacks tested.

---

## Phase 4 — Polish (Week 4–5)

- Realtime in-team chat.
- Admin dashboard: mentor verification workflow, track management, reported issues, user removal.
- Analytics wired in (PostHog/GA).
- Visual/UX pass against `Design.md`.
- Cross-device responsive check, loading/empty states, error states polish.

**Exit criteria:** platform is demo-ready end-to-end — signup through team formation through mentor assignment through chat — with no rough edges in the primary flow.

---

## Ongoing Throughout All Phases

- `Memory.md` updated at the end of every work session: what got done, what's in progress, what's blocked or open.
- Any new open decision surfaced during a phase gets added to `PRD.md`'s open-decisions list rather than silently resolved.
