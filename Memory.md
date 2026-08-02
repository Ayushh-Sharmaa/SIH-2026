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

**Phase:** Phase 0 — Setup (planning docs only; no code yet)

**What exists:**
- Seven planning docs committed: `PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md` (this file), `Security.md`.
- `Security.md` covers rate limiting (per route category), suspicious signup/activity flagging, recurring security checkup cadence, and the skeleton-loading/resilience strategy for slow or high-latency pages. `Rules.md` now points to it — treat it as binding, not optional.

**What does not exist yet:**
- No repo scaffolding (Next.js/Tailwind/Prisma/Supabase not yet initialized).
- No Prisma schema/migrations.
- No auth, no profile pages, no team-formation logic, no AI agents.
- Design direction (metallic vs. flat-dark, accent color, motion approach) not finalized — see `Design.md` Section 1 and 3.

---

## In Progress

*(Nothing in progress yet — update this the moment work starts on Phase 0 setup.)*

Format for entries here:
```
- File/area: <path or feature>
  Status: <what's done, what's left>
  Started: <date>
```

---

## Open Questions (mirror of PRD.md open decisions — update both together)

- Mentor verification: pre-verified list from SIH nodal officers, or self-registered + admin-approved?
- Single-college or open to all SIH 2026 participants nationally?
- Confirm exact team size / mentor count limits against official SIH 2026 rules.
- One combined login with role switch, or fully separate signup flows?
- Final visual direction: dark-metallic vs. flat-dark palette (`Design.md` Option A vs B).
- Final accent color and motion/scroll treatment (pending Figma/Stitch prototyping).

---

## Session Log

### [Date: TBD — fill in when Phase 0 build starts]
- Initialized repo scaffolding.
- ...

### 2026-08-02 — Security.md added
- Created `Security.md`: recurring security checkup cadence, per-route rate limiting table, suspicious signup/activity flagging signals, and skeleton-loading/resilience strategy for slow-loading or high-latency pages.
- Added cross-reference from `Rules.md` to `Security.md`.
- Still no code written. Next step remains Phase 0: repo scaffolding.

### 2026-08-02 — Planning docs created
- Created all six planning docs (`PRD.md`, `Architecture.md`, `Rules.md`, `Phases.md`, `Design.md`, `Memory.md`) from the original MVP spec (`NexaSphere_SIH2026_MVP.md`).
- No code written yet. Next step is Phase 0: repo scaffolding.
