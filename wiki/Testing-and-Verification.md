# Testing & Verification

This document details the automated testing suites, typechecking, contrast auditing, and continuous verification pipeline in **SIH@GLBGOI**.

---

## 1. Verification Pipeline

The repository includes a consolidated verification script that executes all static analysis, unit tests, accessibility audits, and performance checks:

```bash
npm run verify
```

This single command runs:
1. `npm run typecheck` ──► TypeScript compiler checks (`tsc --noEmit`).
2. `npm test` ──────────► 105 unit and regression tests across 30 suites.
3. `npm run test:contrast` ─► Mathematical WCAG AA contrast ratio validation.
4. `npm run audit:perf` ──► Performance architecture and data privacy validation.

---

## 2. Test Suite Breakdown (`tests/`)

The test suite runs using Node.js's native test runner via `tsx --test tests/**/*.test.ts`:

| Test Suite File | Coverage Area | Key Invariants Asserted |
| :--- | :--- | :--- |
| `performanceArchitecture.test.ts` | Theme Authority & Payloads | 17 official themes, avatar URL sanitization, search parameter DoS rejection, QueryClient in-flight deduplication |
| `observableBehavior.test.ts` | User Flows & State Integrity | Deterministic onboarding routing, mentor key verification, directory state integrity (unsearched vs 0-match), contact formatting |
| `avatar.test.ts` | Binary Avatar Streaming | MIME whitelist enforcement, 500 KB size ceiling, regex ID validation, cache header generation |
| `validation.test.ts` | Zod Input Schemas | 10-digit phone limiter, email normalization, DoS length boundaries, registration key lengths |
| `sessionCookie.test.ts` | Session Security | HTTP-only cookie flags, JWT lifetime, SameSite strict attributes, secure token clearing |
| `portalAccess.test.ts` | Whitelist Boundaries | Whitelist role assignment, external domain access, separation between portal access and `/admin` console |
| `rateLimit.test.ts` | In-Memory Limiting | IP window counters, backoff multiplier math, budget tracking, window expiration |
| `mentorKey.test.ts` | Key Verification | Single-use database key matching, compromised key rejection, minimum entropy length |
| `filterAndAuthCascade.test.ts` | Filter Logic | Database filtering combinations, team status logic, session invalidation cascades |
| `ticker.test.ts` | Shared Motion Engine | Frame-rate delta clamping, subscriber lifecycle, clean detachment |

---

## 3. Individual Verification Commands

### TypeScript Compilation
```bash
npm run typecheck
```
* Runs `tsc --noEmit` across all `.ts` and `.tsx` source files to guarantee complete type safety with zero implicit `any` fallbacks.

### Automated Unit & Regression Tests
```bash
npm test
```
* Executes the complete test runner. Currently asserts **105 passing tests across 30 test suites**.

### Color Contrast Compliance Audit
```bash
npm run test:contrast
```
* Programmatically calculates the relative luminance and contrast ratio of every token pairing in `src/styles/tokens.css` against the `#EFE9E1` canvas to guarantee **100% WCAG AA compliance**.

### Performance & Privacy Audit
```bash
npm run audit:perf
```
* Audits API route DTO projections to verify that student roll numbers, personal contact numbers, and unverified data are never leaked in public directory responses.

---

## 4. Current Test Results

```text
ℹ tests 105
ℹ suites 30
ℹ pass 105
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

---

[← UI & Design System](UI-and-Design-System) • [Next: Deployment →](Deployment)
