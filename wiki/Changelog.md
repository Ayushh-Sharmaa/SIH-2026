# Platform Changelog

A chronological summary of major architectural releases, performance overhauls, security hardening passes, and UI harmonizations for **SIH@GLBGOI**.

---

## 2026-08 — Unified Search-First Directory Architecture
* **Unified Directory Primitives**: Introduced modular directory components (`DirectoryHero`, `DirectorySearchDeck`, `DirectoryResultsBar`, `DirectoryPagination`, `DirectoryEmptyState`, `TeamCard`, `TeammateCard`).
* **Layout Harmonization**: Aligned both **Browse Teams** and **Browse Teammates** to `Container width="wide"`, eliminating inconsistent narrow editorial margins.
* **Search-First Interaction Model**: Replaced cramped sidebar filters with an elevated, full-width search command deck featuring primary keyword input, filter matrix, and popular suggestion chips.
* **Bounded Cursor Pagination**: Standardized cursor/bounded navigation without forcing offset calculations.
* **Theme Cache Reuse**: Integrated theme dropdowns directly with the shared `sih_theme_list` `QueryClient` cache.

---

## 2026-08 — Validation & Contact Integrity Pass
* **10-Digit Mobile Limiter**: Added strict validation across Zod profile and query schemas to require exactly 10 digits for mobile numbers.
* **Directory Phone Formatting**: Standardized institutional directory contacts with the `+91` international dialing prefix.
* **Coordinator Ordering & Roles**: Updated student and faculty coordinator profiles, ordering, and phone/email metadata to reflect official institutional records.

---

## 2026-08 — Security & Authorization Hardening
* **Session Forgery Elimination**: Removed fallback literal JWT secrets in `src/lib/auth.ts`, enforcing ≥ 32 character cryptographic secrets and throwing in production if misconfigured.
* **Admin Privilege Lockdown**: Sealed auto-provisioning vulnerabilities on administrative routes, restricting `/admin` access strictly to verified `AdminEmail` entries.
* **Avatar Endpoint Armor**: Hardened `/api/avatar/[userId]` with identifier regex validation, strict raster MIME allowlist, 500 KB payload ceiling, and 120 req/min/IP rate limiting.
* **Data Masking Boundaries**: Enforced privacy masking of student roll numbers and phone contacts on public search endpoints.

---

## 2026-08 — Performance Architecture Overhaul
* **Binary Avatar Streaming**: Transformed database base64 images into `/api/avatar/[userId]` streaming responses, reducing search payload sizes from **2.5 MB to 5.6 KB (> 99.7% reduction)**.
* **Two-Stage Dashboard**: Decoupled dashboard loading into Stage 1 Fast Bootstrap (439 bytes, < 100ms) and Stage 2 Async Relationship Loader.
* **QueryClient In-Flight Request Deduplication**: Added client-side memory caching with stale-while-revalidate and in-flight Promise sharing.
* **Bounded Projections**: Enforced `take: 24` bounded cursor pagination and explicit Prisma `select` projections across all directories.
* **Mentor Load Modernization**: Removed artificial mentor capacity limits, deriving guided team counts dynamically from `Team.mentorId`.
* **Immutable Code Ledger**: Introduced `TeamCodeReservation` to guarantee human-readable team codes (e.g. `GLB100`) are never re-used.

---

## 2026-08 — Initial Platform Launch (NexaSphere MVP)
* **Core Foundation**: Next.js App Router, Tailwind CSS, Prisma ORM, and Supabase PostgreSQL.
* **Student Onboarding**: Progressive profiling for skills, branch, and 17 official SIH themes.
* **Team Formation**: Team creation, member recruitment notices, join requests, and team invitations.
* **Mentorship Portal**: Faculty mentor directory and team mentorship requests.

---

[← Troubleshooting](Troubleshooting) • [Return to Home →](Home)
