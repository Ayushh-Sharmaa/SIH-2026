# Platform Architecture

This document describes the high-performance system architecture, component boundaries, data lifecycle, and caching layers powering **SIH@GLBGOI**.

---

## Architectural Overview

```text
┌────────────────────────────────────────────────────────────────────────┐
│                              CLIENT TIER                                │
│                                                                        │
│  React 19 Server & Client Components (App Router)                      │
│  ├── Atmospheric Surfaces & Framer Motion transitions                  │
│  ├── Search-First Directory Decks (Browse Teams, Teammates, Mentors)   │
│  └── QueryClient (In-memory Cache, Dedup, Stale-While-Revalidate)      │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ HTTPS / JSON & Binary Streams
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             APPLICATION TIER                            │
│                                                                        │
│  Next.js 16 Route Handlers (Edge & Node.js Runtime)                    │
│  ├── Clerk OAuth & First-Party JWT Auth Bridge                         │
│  ├── In-Memory Rate Limiting (IP & User windows)                       │
│  ├── Zod Input Validation & DoS Ceiling Protection                     │
│  ├── Progressive Profile Mutation Handlers                             │
│  ├── Two-Stage Dashboard Endpoints (Bootstrap vs Relationship Data)    │
│  └── Binary Avatar Streaming Endpoint (/api/avatar/[userId])           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ Prisma Client (Prepared Statements)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                               DATA TIER                                 │
│                                                                        │
│  Supabase Managed PostgreSQL                                           │
│  ├── Transaction Pooler (Port 6543, PgBouncer) -> Application Queries  │
│  ├── Session Pooler (Port 5432) -> Database Migrations                 │
│  ├── Compound B-Tree Indexes (teamStatus, isDemo, skills, branch/year) │
│  └── Immutable TeamCodeReservation Ledger & Allocation Triggers        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## Key Architectural Layers

### 1. App Router & Page Structure (`src/app/`)

Next.js 16 App Router organizes routes into focused functional domains:

* `src/app/(public)`: Landing page, track catalog, contact page, and authentication portals.
* `src/app/dashboard`: Role-aware control center for students and mentors.
* `src/app/team-formation/`:
  * `browse-teams/`: Search-first directory of active and forming teams.
  * `browse-teammates/`: Search-first directory of participating student profiles.
  * `browse-mentors/`: Directory of verified faculty mentors.
* `src/app/teams/[id]`: Team space, roster view, and leader controls.
* `src/app/students/[id]`: Verified student public profile.
* `src/app/mentors/[id]`: Verified faculty mentor public profile.
* `src/app/admin/`: Admin verification, team oversight, and whitelist console.

### 2. Client & Server Component Boundaries

To maximize rendering performance and eliminate unnecessary hydration overhead, the platform enforces strict component separation:

| Component Type | Primary Responsibilities | Examples |
| :--- | :--- | :--- |
| **Server Components** | Static layout structure, metadata injection, server-side data loading, and SEO | Page shells, static layout wrappers, metadata headers |
| **Client Components (`"use client"`)** | Interactive UI state, form handling, Framer Motion animations, QueryClient subscriptions | `DirectorySearchDeck`, `TeamCard`, `JoinRequestModal`, `ToastProvider` |
| **Presentational Components** | Stateless rendering based purely on DTO props | `Badge`, `Icon`, `Divider`, `Container`, `LoadingStates` |

---

## Data Fetching & Caching Strategy

### QueryClient In-Memory Caching (`src/lib/queryClient.ts`)

The client uses a custom `QueryClient` implementation tailored for Next.js to provide:
1. **In-Flight Request Deduplication**: If multiple components request the same cache key simultaneously, only one network request is dispatched.
2. **Stale-While-Revalidate**: Instant UI hydration from memory cache while fetching fresh data in the background.
3. **Targeted Invalidation**: Exact cache key invalidation on write actions (e.g., updating profile invalidates `dashboard_bootstrap` and `teammates:*`).

#### Established Cache Policies

| Cache Key Pattern | TTL (ms) | Target Data |
| :--- | :--- | :--- |
| `sih_theme_list` | 300,000 (5 min) | The 17 official SIH problem statement themes |
| `teams:<normalized-query>:<page>` | 30,000 (30 sec) | Team directory search results |
| `teammates:<normalized-query>:<page>` | 15,000 (15 sec) | Student directory search results |
| `mentors:<normalized-query>:<page>` | 30,000 (30 sec) | Faculty mentor directory results |
| `dashboard:bootstrap:<userId>` | 10,000 (10 sec) | User identity, role, and profile completion status |

---

## Two-Stage Dashboard Loading Model

Instead of waiting for a massive monolithic dashboard payload, the dashboard loads in two independent stages:

```text
Stage 1: /api/dashboard/bootstrap (< 100ms)
├── Fast identity resolution
├── Role & verification state
└── Profile completion progress
     │
     ▼ (Initial Dashboard UI paints immediately)
Stage 2: /api/dashboard/team-details (Parallel Async Load)
├── Current team roster & member avatars
├── Pending join requests & invitations
└── Mentorship status & inquiries
```

---

## Database Connection Pooling

PostgreSQL connection handling is split across two Supabase endpoints:

1. **`DATABASE_URL` (Port 6543)**: Connects to **PgBouncer** in transaction pooling mode. Used for all application API route queries to support high concurrency and fast connection handoffs.
2. **`DIRECT_URL` (Port 5432)**: Connects directly to the PostgreSQL session engine. Required for Prisma CLI operations, schema migrations (`prisma migrate dev`), and advisory locks.

---

[← Back to Home](Home) • [Next: Authentication & Onboarding →](Authentication-and-Onboarding)
