# SIH@GLBGOI

> **Smart India Hackathon Team Discovery & Student Opportunity Platform**

SIH@GLBGOI is a centralized student platform for Smart India Hackathon participation, team formation, mentor coordination, opportunity discovery, and campus collaboration at GL Bajaj Group of Institutions.

---

## What is SIH@GLBGOI?

Smart India Hackathon (SIH) is one of India's largest nationwide hackathons, requiring multi-disciplinary student teams to solve real-world problem statements issued by central ministries, state departments, and industry partners.

Historically, students and faculty faced recurring logistical hurdles every hackathon cycle:
* **Discovering compatible teammates** across different academic years, departments, and technical skill stacks.
* **Finding available faculty mentors** with specific domain expertise (e.g., AI/ML, MedTech, IoT, Cybersecurity).
* **Tracking team formation rules** (strictly 6 members per team, female student representation requirements, problem statement claim locks).
* **Communication and coordination** across multiple departments and campus blocks.

**SIH@GLBGOI** streamlines this entire journey into a modern, search-first, high-performance web platform:

```text
Student Onboarding ──► Skill & Theme Profiling ──► Search-First Directory ──► Team Space & Invitations ──► Mentor Review
```

---

## Platform Architecture

```text
User Browser
  │
  ▼
Clerk Authentication (@glbajajgroup.org OAuth SSO)
  │
  ▼
Next.js 16 Application (App Router + React 19)
  │
  ├── React UI (Warm Light Editorial Design System)
  │     └── QueryClient (In-memory caching & request deduplication)
  │
  ▼
API Route Handlers (Semantic HTTP, Rate-Limited, Bounded take: 24)
  │
  ▼
Prisma ORM (Explicit DTO Projections & Transactional Claims)
  │
  ▼
Supabase PostgreSQL (Transaction Pooler port 6543 / Session Pooler port 5432)
```

---

## Verified Current Platform Highlights

* **Server-Verified Clerk Authentication**: Strict domain restriction (`@glbajajgroup.org`) with first-party HTTP-only JWT sessions.
* **Dual Onboarding Flows**: Distinct, role-aware onboarding paths for **Students** and **Faculty Mentors**.
* **Progressive Profile Completion**: Multi-tile profile updates (Personal Info, Technical Skills, Theme Interests) with auto-propagating status.
* **Search-First Discovery Hubs**: Elevated command deck interface for browsing teams, candidate teammates, and faculty mentors.
* **Bounded Result Sets**: Strict database-side filtering with `take: 24` bounded cursor pagination to prevent memory bloat.
* **QueryClient In-Flight Request Deduplication**: Memory cache with stale-while-revalidate protection preventing request storms.
* **Binary Avatar Streaming**: Inline base64 conversion to cached binary streaming endpoint (`/api/avatar/[userId]`), achieving **> 99% JSON payload reduction**.
* **Immutable Team Code Ledger**: `TeamCodeReservation` ledger guaranteeing human-readable team codes (e.g., `GLB100`) can never be re-used or collided.
* **Transactional Team Claims**: Race-condition-free team seat claims, mentor requests, and member invitations.
* **Warm Light Editorial Design System**: Custom token-driven palette (`#322D29` ink, `#72383D` accent, `#EFE9E1` canvas) with WCAG AA compliance.

---

## Current Theme Authority

The platform operates on **17 authoritative official SIH themes** defined centrally in [`src/lib/tracks.ts`](file:///d:/SIH@GLBGOI/src/lib/tracks.ts).

User-facing terminology across the UI, search decks, and documentation strictly uses:
* **Theme** / **Themes**
* **Primary Theme**
* **Secondary Theme**
* **Themes & Links**

*Note: Internal system identifiers such as `PS-MEDTECH` or `PS-AGRITECH` are reserved for machine routing and problem statement code mapping.*

---

## Documentation Directory

| Section | Description |
| :--- | :--- |
| [Getting Started](Getting-Started) | Prerequisites, local installation, environment variables, and verification commands |
| [Architecture](Architecture) | Next.js App Router, layer breakdown, client/server boundaries, and QueryClient |
| [Authentication & Onboarding](Authentication-and-Onboarding) | Google SSO, Clerk integration, role assignment, and mentor registration keys |
| [Student Experience](Student-Experience) | Dashboard overview, progressive profile completion tiles, and team space |
| [Mentor Experience](Mentor-Experience) | Mentor dashboard, unbounded team guidance, request reviews, and privacy rules |
| [Team Formation](Team-Formation) | Creating teams, managing rosters, recruitment notices, and join requests |
| [Search & Discovery](Search-and-Discovery) | Search-first directory layout, database filtering, debouncing, and pagination |
| [Themes](Themes) | The 17 official SIH themes, selection rules, and display conventions |
| [API Documentation](API-Documentation) | Complete reference for all REST API endpoints, DTOs, and status codes |
| [Database & Prisma](Database-and-Prisma) | Prisma schema entities, relationships, indexes, and migration workflows |
| [Performance Architecture](Performance-Architecture) | Payload optimization, two-stage loading, avatar streaming, and caching |
| [Security & Privacy](Security-and-Privacy) | Role boundaries, student/mentor data masking, rate limiters, and tokens |
| [UI & Design System](UI-and-Design-System) | Warm Light Editorial tokens, typography scale, surfaces, and animations |
| [Testing & Verification](Testing-and-Verification) | Test suite breakdown, typechecking, contrast auditing, and CI verification |
| [Deployment](Deployment) | Production deployment steps, Supabase connection pooling, and Vercel setup |
| [Troubleshooting](Troubleshooting) | Solutions for common auth, database, caching, and build errors |
| [Changelog](Changelog) | Chronological development history and major architectural milestones |

---

## Documentation Status

* **Last Reviewed**: August 2026
* **Source of Truth**: Current synchronized repository (`main`)
* **Test Suite Status**: 105 tests passing (30 suites)
