# Performance Architecture

This document chronicles the architectural evolution of **SIH@GLBGOI** from a monolithic prototype to a high-performance, bounded, and staged production system.

---

## 1. Architectural Evolution

```text
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│           OLD ARCHITECTURE           │       │           NEW ARCHITECTURE           │
├──────────────────────────────────────┤       ├──────────────────────────────────────┤
│ ❌ Monolithic 2.5 MB Search Payloads │ ────► │ ✅ Bounded 5.6 KB JSON Payloads      │
│ ❌ Inline Base64 Data URIs           │ ────► │ ✅ Binary Avatar Streaming Endpoint  │
│ ❌ Monolithic 3-Second Dashboard     │ ────► │ ✅ Staged Dashboard (< 100ms Paint)  │
│ ❌ Unbounded Fetch-All Directories   │ ────► │ ✅ Bounded Cursor Pagination (take:24│
│ ❌ Redundant Request Cascades        │ ────► │ ✅ QueryClient In-Flight Dedup       │
│ ❌ Monolithic Profile Forms          │ ────► │ ✅ Focused Progressive Tile Updates  │
└──────────────────────────────────────┘       └──────────────────────────────────────┘
```

---

## 2. Key Verified Optimizations

### A. Binary Avatar Streaming (`/api/avatar/[userId]`)
* **The Problem**: In initial prototypes, profile pictures were stored as raw base64 data URIs and embedded directly inside student directory search results. A query returning 24 students yielded a massive **2.5 MB JSON payload**, consuming heavy mobile data and causing noticeable main-thread parse lag.
* **The Solution**: The `sanitizeAvatarUrl` utility transforms base64 data into streaming URLs: `/api/avatar/[userId]?v=${hash}`. The endpoint streams the binary image directly with aggressive browser caching headers:
  ```http
  Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable
  ```
* **Measured Result**: Directory JSON response size dropped from **2.5 MB to 5.6 KB (> 99.7% reduction)**.

---

### B. Two-Stage Dashboard Loading
* **The Problem**: The dashboard previously executed complex multi-table joins (identity + profile + team roster + open notices + join requests + invitations + mentorship status) in a single blocking endpoint that took over 2.4 seconds on cold pool startup.
* **The Solution**: Decoupled the loading into two stages:
  1. **Stage 1 (`/api/dashboard/bootstrap`)**: Ultra-compact payload (439 bytes) resolving identity, role, and profile progress in **< 100ms**. Initial dashboard paints instantly.
  2. **Stage 2 (`/api/dashboard/team-details`)**: Heavy relationship data loads asynchronously in parallel, hydrating the team space without blocking interaction.

---

### C. Client-Side In-Flight Request Deduplication
* **The Problem**: Simultaneous component mounts (e.g. Navigation bar + Dashboard + Directory filter) previously fired duplicate `/api/tracks` or `/api/auth/me` calls within milliseconds of each other.
* **The Solution**: `QueryClient` intercepts concurrent calls for identical cache keys and shares the in-flight Promise:
  ```typescript
  // If call 1 is pending, call 2 awaits the same Promise rather than issuing a network request
  const [res1, res2] = await Promise.all([
    QueryClient.fetch('sih_theme_list', fetcher),
    QueryClient.fetch('sih_theme_list', fetcher),
  ]);
  ```

---

### D. Bounded Database Projections (`take: 24`)
* **The Problem**: Unbounded directory fetches transferred hundreds of records into client memory.
* **The Solution**: All searches are enforced with `take: 24` bounded cursor pagination and explicit Prisma `select` projections, keeping database memory usage and network transfer bounded under peak load.

---

### E. Debounced Search with Stale-Request Protection
* **The Problem**: Fast typing in search inputs triggered network request storms that returned out of order, overwriting newer filter results with stale data.
* **The Solution**: A 300ms debounce timer delays dispatching requests while the user types, accompanied by an `AbortController` that cancels in-flight HTTP requests. Stale responses returning out of sequence are dropped using `latestRequestIdRef`.

---

[← Database & Prisma](Database-and-Prisma) • [Next: Security & Privacy →](Security-and-Privacy)
