# Authentication & Onboarding

This document covers user authentication, Google SSO integration, domain verification, role-based onboarding gates, and mentor registration keys.

---

## Authentication Overview

SIH@GLBGOI uses **Clerk** as the primary OAuth identity provider coupled with a **first-party HTTP-only JWT session bridge**.

### Student Lifecycle

```text
Google OAuth (Clerk)
        │
        ▼
Domain Verification (@glbajajgroup.org / WhitelistedEmail)
        │
        ▼
Server-Side Account Sync (POST /api/auth/clerk-sync)
        │
        ▼
Onboarding Gate (Select Role -> Student)
        │
        ▼
Progressive Academic & Skill Profiling
        │
        ▼
Student Dashboard (/dashboard)
```

### Mentor Lifecycle

```text
Google OAuth (Clerk)
        │
        ▼
Server-Side Account Sync (POST /api/auth/clerk-sync)
        │
        ▼
Onboarding Gate (Select Role -> Mentor)
        │
        ▼
Registration Key Verification (MentorRegistrationKey)
        │
        ▼
Faculty Mentor Dashboard (/dashboard)
```

---

## Domain Restriction & Whitelisting

### 1. Default Institutional Domain
By default, only users signing in with official Google Workspace accounts ending in:
```text
@glbajajgroup.org
```
are permitted into the platform.

### 2. External Whitelisted Access (`WhitelistedEmail`)
For invited industry mentors, guest faculty, or select external collaborators with `@gmail.com` or other domains, administrators can add entries to the `WhitelistedEmail` table via the `/admin` portal.

* Whitelisted entries can grant either `STUDENT` or `MENTOR` portal access.
* Whitelisted access **never** grants `/admin` console privileges.

---

## Server-Side Verification (`/api/auth/clerk-sync`)

When a user completes Clerk sign-in, the client issues a `POST /api/auth/clerk-sync` request:

1. **Token Validation**: Verifies the active Clerk session on the backend.
2. **User Reconciliation**: Looks up the user in PostgreSQL by Clerk email or creates a new `User` record.
3. **Session Cookie Issuance**: Mints a secure, first-party `JWT` session cookie:
   * Algorithm: `HS256`
   * Attributes: `HttpOnly`, `SameSite=Lax`, `Secure` (in production), `Path=/`
   * Expiration: 7 days
4. **Deterministic Redirect Resolution**:
   * If profile is incomplete (`isOnboarded: false`) ──► Redirects to `/onboarding`
   * If profile is complete (`isOnboarded: true`) ──► Redirects to `/dashboard`

---

## Mentor Registration Key System

To ensure that only authorized faculty and appointed mentors register with the `MENTOR` role, the platform enforces key verification during onboarding:

1. **Single-Use Database Keys (`MentorRegistrationKey`)**:
   * Administrators issue unique, single-use keys (e.g. `GLB-MENTOR-2026-XXXX`).
   * When a mentor submits their onboarding form, the key is verified and marked `isUsed: true` with `usedByUserId` recorded atomically.
2. **Department Master Key Bypass (`GLB_MENTOR_MASTER_KEY`)**:
   * Optional environment variable for bulk institutional setups.
   * If configured, must be a cryptographically strong string (≥ 24 characters).
   * If unset, only database keys are accepted.

---

## Role Matrix & Permissions

| Role | Access Scope | Key Capabilities |
| :--- | :--- | :--- |
| **STUDENT** | Student Dashboard, Team Space, Directories | Create teams, join teams, invite members, request mentors, update skills/themes |
| **MENTOR** | Mentor Dashboard, Directory Listings | Guide unlimited teams, accept/decline mentorship inquiries, showcase domain expertise |
| **ADMIN** | Admin Console (`/admin`) | Manage student records, verify mentors, manage whitelist, oversee team allocations |

---

[← Architecture](Architecture) • [Next: Student Experience →](Student-Experience)
