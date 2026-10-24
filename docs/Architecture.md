# SIH@GLBGOI — Performance & System Architecture

This document describes the high-performance, bounded, and staged architecture powering the **SIH@GLBGOI** platform.

---

## 1. Application Flow & Data Model

```
Visitor lands on "/"
   │
   ▼
Clerk OAuth Sign-in ──► @glbajajgroup.org domain validation
   │
   ▼
Onboarding Gate ──────► Checks database for completed profile
   │                     New users: Select Role (Student / Mentor)
   │
   ▼
Staged Dashboard
   ├── Stage 1: Fast Bootstrap (/api/dashboard/bootstrap) — <100ms
   │     Resolves identity, role, and tile completion state.
   └── Stage 2: Async Data Section (/api/dashboard/team-details)
         Loads assigned rosters, pending requests, and invites.
   │
   ▼
Discovery Hubs (Bounded Pagination: take: 24)
   ├── Browse Teammates (/team-formation/browse-teammates)
   ├── Browse Teams     (/team-formation/browse-teams)
   └── Browse Mentors   (/team-formation/browse-mentors)
```

---

## 2. Core Performance Tenets

### A. Compact Projections & Bounded Result Sets
* All directory search queries use explicit Prisma `select` projections (never `select *`).
* Results are strictly capped with `take: 24` pagination (cursor and offset support).
* Compound indexing on filter fields (`skills`, `expertise`, `status`, `userId`).

### B. Avatar Streaming & Payload Optimization
* Inline base64 image strings in the database are transformed via `sanitizeAvatarUrl` into `/api/avatar/[userId]?v=${hash}`.
* The dedicated endpoint [`/api/avatar/[userId]`](file:///d:/SIH@GLBGOI/src/app/api/avatar/[userId]/route.ts) streams the raw binary image with long-lived browser caching:
  `Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable`
* Reduces search JSON response sizes by **> 99%** (Teammate search reduced from 2.5 MB to 5.6 KB).

### C. Two-Stage Dashboard Loading Model
* **Stage 1 (Bootstrap)**: Ultra-compact payload (439 bytes) returning only what is needed to render the header, identity banner, and profile status.
* **Stage 2 (Team Details)**: Independent parallel fetch for heavy relationships (team rosters, join requests, invites), rendered asynchronously without blocking the initial UI paint.

### D. Progressive Profile Mutations
Instead of large monolithic form submissions, profiles are updated through 3 focused mutation tiles:
* **Student**:
  * Tile 1: Personal & Academic (`PATCH /api/profile/personal`)
  * Tile 2: Technical Skills (`PATCH /api/profile/skills`)
  * Tile 3: Track & Hackathon Interests (`PATCH /api/profile/themes`)
* **Faculty Mentor**:
  * Tile 1: Personal & Department (`PATCH /api/profile/mentor` with `section: 'personal'`)
  * Tile 2: Domain Expertise (`PATCH /api/profile/mentor` with `section: 'expertise'`)
  * Tile 3: Professional Bio & Links (`PATCH /api/profile/mentor` with `section: 'bio'`)

### E. Centralized Client-Side Caching (`QueryClient`)
* Deduplicates in-flight concurrent requests for the same cache key.
* Caches read-heavy query responses in memory with configurable TTLs (e.g. 30s fresh TTL for directories, 120s TTL for tracks).
* Targeted cache invalidation (`QueryClient.invalidate`) upon mutations (e.g. profile edit, team join, request status change).

---

## 3. Directory Layout & Key Modules

```
src/
├── app/
│   ├── api/
│   │   ├── avatar/[userId]/route.ts       # Binary avatar streaming with rate limiting
│   │   ├── dashboard/
│   │   │   ├── bootstrap/route.ts         # Stage 1 fast user bootstrap
│   │   │   └── team-details/route.ts      # Stage 2 async relationship loader
│   │   ├── profile/
│   │   │   ├── personal/route.ts          # Student identity tile
│   │   │   ├── skills/route.ts            # Student skills tile
│   │   │   ├── themes/route.ts            # Student tracks tile
│   │   │   └── mentor/route.ts            # Faculty mentor progressive tiles
│   │   ├── students/route.ts              # Teammate search directory (bounded 24)
│   │   ├── mentors/route.ts               # Mentor directory (bounded 24, private)
│   │   ├── teams/route.ts                 # Teams directory & management
│   │   └── tracks/route.ts                # 17 Official Themes catalog
│   ├── dashboard/page.tsx                 # Student & Faculty Mentor dashboard views
│   └── team-formation/                    # Discovery directories
├── lib/
│   ├── avatar.ts                          # Avatar URL sanitizer & data URI parser
│   ├── queryClient.ts                     # In-flight dedup & in-memory cache
│   ├── tracks.ts                          # Authoritative 17 SIH themes
│   ├── validation.ts                      # Zod input schemas with DoS bounds
│   └── rateLimit.ts                       # In-memory IP/User rate limiters
└── tests/
    └── performanceArchitecture.test.ts    # Regression test suite
```
