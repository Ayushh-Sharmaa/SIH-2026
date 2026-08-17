# SIH@GLBGOI — Security, Authorization & Abuse Prevention

This document governs the platform's security boundaries, authentication flows, role-based authorization controls, rate limiting, and avatar endpoint abuse protection.

---

## 1. Authentication & Token Lifecycle

* **Clerk OAuth Bridge**: User identity is verified against Clerk. Only authenticated sessions with official `@glbajajgroup.org` Google workspace accounts are admitted.
* **First-Party Session Tokens**: Mints standard HTTP-only JWT session cookies upon login with strict SameSite attributes.
* **Semantic Status Codes**:
  * `401 Unauthorized`: Token missing, expired, or malformed.
  * `403 Forbidden`: Authenticated user lacks permission for the targeted role-restricted action (e.g. student invoking mentor mutation APIs).

---

## 2. Avatar Endpoint Security (`/api/avatar/[userId]`)

To prevent the avatar streaming endpoint from becoming an unrestricted profile-image oracle or abuse vector, the following controls are enforced:

| Security Vector | Implementation & Rule |
| :--- | :--- |
| **Identifier Validation** | Validates `userId` against `/^[a-zA-Z0-9_-]{1,64}$/`. Malformed IDs, SQL injection strings, or directory traversal sequences (`../`, `..%2f`) return immediate `400 Bad Request`. |
| **Oracle & Enumeration Prevention** | Queries only active registered users (`isDemo: false`). Non-existent or inactive user IDs return a uniform `404 Avatar not found` with `Cache-Control: no-store` to prevent metadata leakage. |
| **Dedicated IP Rate Limiting** | Enforces `120 requests / min / IP` via in-memory rate limiter, returning `429 Too Many Requests` with standard `Retry-After` headers. |
| **Strict MIME Allowlist** | Permits only safe raster image formats: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Any other MIME type (including SVG and HTML) returns `415 Unsupported Media Type` to eliminate stored XSS vectors. |
| **Payload Size Ceiling** | Enforces a maximum byte cap of **500 KB** per avatar image. Oversized buffers return `413 Payload Too Large`. |
| **Security Headers** | Emits `X-Content-Type-Options: nosniff`, `Content-Security-Policy: default-src 'none'`, and `Content-Length`. |
| **Browser Caching & Invalidation** | Emits `Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable` with content-derived version parameter (`?v=${hash}`) for immediate cache busting upon photo update. |

---

## 3. Privacy Boundaries & Data Masking

Public search directories and prospective inquiries enforce strict DTO projections to prevent data harvesting:

* **Public Student Discovery (`/api/students`)**: Excludes student roll numbers (`rollNo`) and mobile contact details (`contact`).
* **Public Mentor Directory (`/api/mentors`)**: Excludes private faculty phone contacts (`contact`).
* **Prospective Mentorship Inquiries (`/api/dashboard/team-details`)**: Excludes team member emails and phone numbers from pending mentorship inquiry requests until the mentorship is accepted.

---

## 4. Rate Limiting Categories

| Category | Endpoints | Default Limit | Purpose |
| :--- | :--- | :--- | :--- |
| **Auth & Sync** | `/api/auth/*` | 5 req / 10 min / IP | Mitigates credential stuffing and brute force |
| **Avatar Streaming** | `/api/avatar/*` | 120 req / min / IP | Protects streaming endpoint against scraping loops |
| **Directory Search** | `/api/students`, `/api/mentors`, `/api/teams` | 60 req / min / user | Generous browsing threshold |
| **Mutations & Invites** | `/api/profile/*`, `/api/teams/*` | 20 req / 10 min / user | Prevents invite-spam and automated form probing |
| **Dashboard Bootstrap** | `/api/dashboard/*` | 60 req / min / user | Fast, deduped user bootstrap |

---

## 5. Security & Regression Verification

Automated security and privacy assertions are verified in the CI/CD pipeline via `npm run verify`:
* `tests/performanceArchitecture.test.ts`: Asserts avatar security, MIME validation, search input limits, and cache invalidation.
* `scripts/performance-audit.ts`: Asserts data masking, privacy bounds, and role separation boundaries.
