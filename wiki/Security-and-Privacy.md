# Security & Privacy

This document outlines the security architecture, role authorization boundaries, rate limiting controls, and data privacy masking in **SIH@GLBGOI**.

---

## 1. Authentication & Session Security

* **Clerk OAuth SSO**: Authenticates user identity via Google Workspace SSO. Only validated institutional accounts (`@glbajajgroup.org`) or explicitly whitelisted addresses are accepted.
* **HTTP-Only JWT Sessions**: First-party session tokens are signed with a cryptographically secure `NEXTAUTH_SECRET` (minimum 32 characters, `HS256` algorithm) and stored in `HttpOnly`, `SameSite=Lax`, `Secure` cookies.
* **Session Forgery Prevention**: The server strictly rejects fallback literal secrets, binds token `issuer` and `audience`, and enforces signature expiration.
* **No Sensitive Data in Client Storage**: No authentication tokens, roll numbers, or personal phone numbers are ever persisted in `localStorage` or `sessionStorage`.

---

## 2. Role-Based Access Control (RBAC)

All API route handlers enforce strict server-side authorization checks:

```text
Request ──► Verify Session JWT ──► Validate Role Matrix ──► Execute Controller
```

| Scope / Action | Required Role | Enforcement Failure Response |
| :--- | :--- | :--- |
| Create Team / Send Invites | `STUDENT` | `403 Forbidden` |
| Accept Mentorship Inquiry | `MENTOR` | `403 Forbidden` |
| Access Admin Console (`/admin`) | `ADMIN` (and in `AdminEmail` table) | `403 Forbidden` / Redirect |
| Update Profile Section | Matching `userId` | `403 Forbidden` |

---

## 3. Data Privacy & Projection Masking

To prevent bulk scraping, student identity harvesting, and unsolicited contact:

1. **Student Search Masking (`/api/students`)**:
   * Omission: Excludes college roll numbers (`rollNo`), section, category, and phone numbers (`contact`).
   * Inclusion: Returns only academic branch, year, skill tags, language fluency, and team status.
2. **Mentor Directory Masking (`/api/mentors`)**:
   * Omission: Excludes personal faculty phone numbers from public listings.
   * Inclusion: Returns name, designation, department, and domain expertise tags.
3. **Prospective Inquiry Masking (`/api/dashboard/team-details`)**:
   * Student contact information remains masked in incoming mentor inquiries until the mentor explicitly accepts the mentorship.

---

## 4. Binary Avatar Endpoint Security (`/api/avatar/[userId]`)

To prevent the avatar streaming endpoint from becoming an abuse vector or enumeration oracle:

| Security Defense | Mechanism |
| :--- | :--- |
| **Identifier Validation** | Regex validation (`/^[a-zA-Z0-9_-]{1,64}$/`). Malformed inputs or path traversals (`../`) return `400 Bad Request`. |
| **Enumeration Protection** | Non-existent users return `404 Not Found` with `Cache-Control: no-store` to prevent metadata leakage. |
| **Strict MIME Allowlist** | Only permits raster images: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. SVGs and HTML return `415 Unsupported Media Type` to prevent stored XSS. |
| **Payload Size Ceiling** | Enforces a strict **500 KB** cap per image buffer. Oversized payloads return `413 Payload Too Large`. |
| **Dedicated IP Rate Limit** | Enforces `120 requests / min / IP` with standard `Retry-After` headers. |
| **Security Headers** | Emits `X-Content-Type-Options: nosniff` and `Content-Security-Policy: default-src 'none'`. |

---

## 5. Rate Limiting Categories

| Category | Targeted Endpoints | Window & Quota | Primary Protection |
| :--- | :--- | :--- | :--- |
| **Authentication** | `/api/auth/*` | 5 failures / 10 min | Credential stuffing & brute-force mitigation |
| **Avatar Streaming** | `/api/avatar/*` | 120 req / min / IP | Scraping loop & denial-of-service protection |
| **Directory Search** | `/api/students`, `/api/teams`, `/api/mentors` | 60 req / min / user | Search abuse & database load mitigation |
| **Mutations & Invites**| `/api/profile/*`, `/api/teams/*` | 20 req / 10 min / user | Invite-spam & form probing protection |
| **Dashboard Bootstrap**| `/api/dashboard/*` | 60 req / min / user | High-speed, cached bootstrap access |

---

[← Performance Architecture](Performance-Architecture) • [Next: UI & Design System →](UI-and-Design-System)
