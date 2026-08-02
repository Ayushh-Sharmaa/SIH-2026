# NexaSphere — Security & Resilience

This file governs how the platform protects itself (rate limits, abuse detection) and how it stays usable under load (skeleton loading instead of visible slowness/crashes). Same rule as `Rules.md`: if a change conflicts with something here, flag it rather than silently deviating. Update `Memory.md` whenever a rule here is added, changed, or a checkup turns something up.

---

## 1. Regular Security Checkups

Security isn't a one-time setup — it's a recurring task with an owner and a cadence.

| Checkup | Frequency | What it covers |
|---|---|---|
| Dependency audit | Weekly (automated) | `npm audit` / Dependabot alerts on all packages; anything high/critical gets patched or replaced within 48 hours |
| Auth flow review | Every phase boundary (see `Phases.md`) | Confirm signup/login/college-email-verification still reject malformed input, expired tokens, and reused OTPs |
| Access control review | Every phase boundary | Confirm students can't hit mentor/admin-only routes and vice versa; re-test every new API route against role checks |
| Secrets scan | On every commit (automated, pre-commit hook or CI) | No API keys, DB URLs, or tokens committed — see `Rules.md` Section 2 |
| Rate-limit effectiveness review | Monthly | Look at real traffic logs — are limits (Section 2 below) too tight, too loose, or being hit by legitimate users? Adjust |
| Flagged-activity review | Weekly, by admin | Admin walks through everything the flagging system (Section 3) surfaced that week and resolves/dismisses each |

**Automated where possible.** Dependency and secrets scanning should run in CI on every push, not rely on someone remembering. Manual reviews (auth flow, access control) go on a checklist tied to phase transitions so they don't get skipped under deadline pressure.

---

## 2. Rate Limiting — Per-Route, Not Global

A single global rate limit either blocks legitimate heavy use (a student scrolling through `/find-teammates`) or lets abuse through on sensitive routes (repeated signup attempts). Limits are set **per route category**, matched to how sensitive/expensive each one is.

| Route category | Example routes | Suggested limit | Why |
|---|---|---|---|
| Auth — signup/login | `/api/auth/signup`, `/api/auth/login` | 5 requests / 10 min / IP | Highest abuse target (credential stuffing, fake account creation) |
| Auth — OTP/verification | `/api/auth/verify-college-email` | 3 requests / 15 min / account | Prevent OTP brute-forcing |
| Search/browse (read-heavy) | `/api/students`, `/api/mentors`, `/api/tracks` | 60 requests / min / user | Generous — this is normal browsing behavior, shouldn't feel throttled |
| Write actions — social | `/api/teams/:id/invite`, `/api/teams/:id/join-request`, `/api/teams/:id/mentor-request` | 20 requests / 10 min / user | Enough for real usage, tight enough to stop invite-spam |
| AI agent calls | `/api/agent/*` | 10 requests / min / user | These are the most expensive calls (LLM API cost + latency) — also the ones most worth protecting from abuse loops |
| Chat/messages | `/api/teams/:id/messages` | 30 messages / min / user | Generous for real conversation, blocks flood/spam |
| Admin actions | `/api/admin/*` | 30 requests / min / admin | Admins are few and trusted, but still logged and limited against a compromised admin session |

**Implementation notes:**
- Enforce at the API route layer (middleware), not in the frontend — frontend throttling is a UX nicety, not a security control.
- Key limits by authenticated user ID where the user is logged in; fall back to IP only for pre-auth routes (signup/login).
- Return a clear `429` with a `Retry-After` header so the frontend can show a real "try again in Xs" message instead of a generic error.
- Log every rate-limit hit (route, user/IP, timestamp) — these logs feed the flagged-activity review in Section 3.

---

## 3. Flagging Suspicious Signups & Activity

The goal is to surface anomalies for human review, not to auto-ban — false positives on a hackathon platform (bursty signups near deadlines, whole classes signing up in one sitting) are common and shouldn't lock out real students.

### Signals that flag a signup for review
- Multiple accounts created from the same IP within a short window, above what a shared college network / lab would explain (tune this threshold using observed baseline traffic, not a guess).
- College-email verification requested repeatedly for different addresses from one session.
- Disposable/temporary email domains used at signup.
- Profile created with no meaningful data (empty skills, no track interest) followed immediately by high-volume invite/join-request activity — a pattern more consistent with a scripted account than a real student exploring the platform.

### Signals that flag ongoing activity for review
- A single account hitting rate limits repeatedly across multiple route categories in a short period.
- A team receiving an unusually high number of join requests from accounts created in the same short window (coordinated fake-team-filling).
- A mentor account requesting far above its stated capacity in mentor-side actions.
- Rapid sequential profile edits that look like probing for validation gaps rather than normal editing.

### What flagging does
- Writes a row to a `FlaggedActivity` log (user id, signal type, timestamp, supporting data) — this is additive to the existing schema in `Architecture.md`, not a replacement for it.
- Surfaces in the admin dashboard (`/admin`) as a review queue, sorted by recency.
- **Never auto-suspends an account.** Per the AI-agent boundary rule in `Rules.md`, automated systems suggest/flag — an admin decides. The one exception worth considering later: auto-throttling (not banning) an account that's actively hammering rate limits in real time, purely as a load-protection measure, fully reversible and logged.

---

## 4. Resilience Under Load — Skeleton Loading Instead of Visible Slowness

The platform should never show a blank screen, a frozen page, or a raw error to the user just because a fetch or an AI agent call is slow. Every data-dependent view gets a skeleton state.

### Where this applies
- **Any page that fetches from the database:** `/tracks`, `/find-teammates`, `/find-mentors`, `/my-team`, `/dashboard`, `/notifications`.
- **Any page waiting on an AI agent response** (matchmaking ranking, mentor ranking, skill-gap banner, profile assistant) — these are the slowest calls in the system (LLM latency) and are exactly where a skeleton matters most, since a raw filter list is available instantly but the AI-ranked version takes longer.

### How it should work
- Render the page shell and any data that's already available (e.g., a plain filtered list) immediately.
- Show skeleton placeholders (matching the real component's shape — card outlines for team/mentor cards, line placeholders for text) only for the specific piece still loading — not a full-page spinner that blocks everything.
- Once the slower data arrives (AI ranking, skill-gap results), swap the skeleton for the real content in place, without re-rendering or jumping the layout.
- Set a reasonable timeout per data source (e.g., AI agent calls per `Rules.md` already require a fallback on failure — apply the same fallback on *timeout*, not just hard failure: show the plain filtered/unranked list rather than an infinite skeleton).
- Use React Suspense boundaries per section (per `Architecture.md`'s Next.js App Router structure) so one slow section can't block the rest of the page from rendering.

### Practical breakdown by page
| Page | Fast content (render immediately) | Slower content (skeleton while loading) |
|---|---|---|
| `/find-teammates` | Plain filtered student list | AI-ranked order + "why this match" line |
| `/find-mentors` | Plain filtered mentor list | AI-ranked order + fit reasoning |
| `/my-team` | Current roster | AI skill-gap banner, Team Health Agent flags |
| `/dashboard` | Static profile summary | Recommendations, notification counts |
| `/tracks` | Track list + names | Live team counts per track (if computed, not stored) |

**Principle:** the user should always see *something* real within a normal page-load time, with only the genuinely slow parts (AI generation) visibly "still working" — and even those should never look broken, just clearly in progress.

---

## 5. Escalation

If a security checkup or the flagging queue turns up something that looks like active abuse (not just noise) — a coordinated signup wave, a rate-limit pattern consistent with scraping, repeated auth-bypass attempts — log it in `Memory.md`'s session log immediately with what was found and what action was taken, so it isn't lost between sessions.
