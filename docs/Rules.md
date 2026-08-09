# NexaSphere — Build Rules

These are binding rules for anyone (human or AI) contributing code to this repo. If a change conflicts with a rule here, stop and flag it rather than silently deviating.

> See also `Security.md` for rate limiting, suspicious-activity flagging, recurring security checkups, and the skeleton-loading/resilience strategy — those rules are binding alongside this file, not optional extras.

---

## 1. Stack Rules — What to Use

- **Frontend:** Next.js App Router + Tailwind CSS only. No CSS-in-JS libraries, no separate component libraries unless explicitly approved (see Section 2).
- **Backend:** Next.js API routes. Do not spin up a separate Express server unless a specific route genuinely can't live in Next.js API routes (document the reason in `Memory.md` if this happens).
- **Database:** PostgreSQL via Prisma ORM only. All schema changes go through Prisma migrations — never hand-edit the database directly.
- **Auth/Storage/Realtime:** Supabase. Keep all Supabase client calls inside `lib/supabase.ts` — don't instantiate clients inline in components or routes.
- **AI calls:** All Claude API calls go through `lib/claude.ts`. No direct `fetch` calls to `api.anthropic.com` from route handlers or components.
- **State management:** React state + server data via API routes. No Redux/Zustand/Recoil unless a specific, documented cross-cutting state need arises that props/context can't solve.

---

## 2. What to Avoid

- **No unvetted npm packages.** Before adding any new dependency, check: is this solvable with what's already installed? If not, note the addition and the reason in `Memory.md`.
- **No client-side computation of persisted derived fields.** `skills_covered`, `skills_needed`, `member_count`, and `team_status` are computed server-side and read from the database. Mentor guidance count is derived from `Team.mentor_id`, never maintained as a separate counter.
- **No `any` types in TypeScript.** If a type is genuinely unknown, define it properly in `types/index.ts` rather than escaping to `any`.
- **Prisma by default.** Raw SQL is allowed only for a database primitive Prisma cannot express (currently sequence allocation and row locking), must remain parameterized, and must be covered by an integrity test and migration-level constraint.
- **No committing secrets.** API keys, DB URLs, etc. live in `.env.local` only, which is gitignored. Never hardcode a key in a route file "temporarily."
- **No silent schema drift.** If a Prisma model changes, the migration and the `Architecture.md` data model section get updated in the same change.

---

## 3. Error Handling

- Every API route wraps its logic in try/catch and returns a consistent shape: `{ success: boolean, data?: ..., error?: string }`. Don't let a route throw an unhandled 500 with a raw stack trace to the client.
- User-facing errors are short and actionable ("Team is already full" not "Error: constraint violation on team_members").
- AI agent calls (`lib/claude.ts`) must handle: API failure, malformed/non-JSON response, and timeout — each with a graceful fallback (e.g., matchmaking falls back to the plain filter list if the agent call fails). An AI agent going down should never break the underlying feature it's enhancing.
- Log errors server-side with enough context to debug (route, user id, payload shape) but never log full request bodies containing passwords or resumes.

---

## 4. Boundaries for AI Agents (in-product agents, not the AI writing code)

- Every agent call constrains output to structured JSON via the system prompt, per the pattern in `Architecture.md`. No agent should return freeform prose that the frontend has to parse with regex.
- Agents **enhance** ranking/suggestions — they never make irreversible decisions. A student is never auto-added to a team, a mentor request is never auto-accepted, by an agent. Agents suggest; users and explicit accept/decline actions decide.
- Agent output is always re-validated server-side before being trusted (e.g., a skill tag the Profile Assistant invents must be checked against/added to the known skill-tag list, not blindly inserted).
- No agent has write access to the database directly. Agent responses are consumed by the calling route, which then performs the actual DB writes through normal validated logic.

---

## 5. Boundaries for AI Coding Assistants Working on This Repo

- Always check `Memory.md` at the start of a session before making changes, and update it before ending one (what was completed, what file is in progress, any open questions). Don't let context get lost between sessions — that's what `Memory.md` is for.
- Don't invent product decisions that are marked "open" in `PRD.md`'s open-decisions list. Flag them back to Tanishk instead of guessing.
- Don't restructure the folder layout in `Architecture.md` without updating that file in the same change.
- Don't add a new AI agent beyond the 5 defined in `PRD.md`/`Architecture.md` without it being explicitly requested.
- When unsure whether something is in scope for the current phase (see `Phases.md`), default to *not* building it yet and flag it instead of over-building.
