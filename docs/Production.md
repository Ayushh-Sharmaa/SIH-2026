# Production Readiness

Findings from the engineering audit, what was fixed, and what is still open.
Companion to `docs/DesignSystem.md`.

---

## Security findings

### 1. Forgeable session tokens — CRITICAL, fixed

`src/lib/auth.ts` signed JWTs with `process.env.NEXTAUTH_SECRET || '<literal>'`.
The literal was committed to the repository, so **any deployment missing the env
var silently signed sessions with a publicly-known key**. Anyone who read the
source could mint a valid `role: ADMIN` token and the app would accept it.

Fixed:

- The fallback is gone. Production **throws** rather than signing insecurely.
- Development uses an ephemeral per-process secret (`crypto.randomUUID()` ×2), so
  a forgotten env var can never become a shared known secret. Sessions ending on
  restart is the intended prompt to set it.
- `NEXTAUTH_SECRET` must now be ≥32 characters.
- Algorithm pinned to `HS256`, rejecting `alg: none` and HS/RS confusion.
- `issuer` / `audience` bound, so a token minted elsewhere under the same secret
  cannot be replayed here.
- Decoded payload shape is validated; a token missing `userId`/`email`/`role` is
  rejected instead of trusted.
- bcrypt cost raised from 10 to **12** (OWASP's current floor).

> **Action required:** if that literal was ever live, treat every issued session
> as compromised. Rotate `NEXTAUTH_SECRET`, which invalidates all outstanding
> tokens.

### 2. Admin privilege escalation — CRITICAL, fixed

`POST /api/auth/login` auto-provisioned an account when an authorised-admin
email had none:

```ts
if (!user) {
  const passHash = await hashPassword(password);
  user = await prisma.user.create({ ...role: 'ADMIN' });   // ← any password
}
```

The super-admin address is hardcoded in `src/app/admin/page.tsx`. So **whoever
logged in first with that address chose its password and became admin.**

Fixed: no account is ever created during sign-in. A missing account returns the
same `401 Invalid email or password` as a wrong password, so the endpoint cannot
be used to enumerate which admin addresses exist.

### 3. Auth gate accepted unverified cookies — HIGH, fixed

`src/middleware.ts` admitted any request carrying a cookie merely *named*
`token`:

```ts
const token = req.cookies.get('token')?.value;
if (token) return NextResponse.next();   // ← never verified
```

`document.cookie = 'token=x'` in the console walked straight past it.

Severity was contained — every API route independently calls `verifyToken` and
checks `role`, so **no data was exposed**; only the protected page shells
rendered. But the check was one refactor away from being the only defence.

Fixed: the signature is verified via `verifyToken`. A cookie that fails is
cleared (preventing a redirect loop) and the user is sent to `/login` with a
`next` **path** — never an absolute URL, which would be an open-redirect vector.

> **Next.js 16 note:** `middleware` is deprecated and renamed `proxy`, and it now
> defaults to the **Node.js runtime** (`node_modules/next/dist/docs/01-app/
> 03-api-reference/03-file-conventions/proxy.md`). That runtime change is what
> allows `jsonwebtoken` to run in the gate at all — on Edge it could not, and
> this fix would have required `jose` or hand-rolled Web Crypto. The
> `middleware.ts` filename is retained because Clerk resolves its handler from
> that path; the build confirms it as `ƒ Proxy (Middleware)`.

### 4. Secrets hygiene — no leak, one recommendation

`.env` is correctly gitignored and **has never been committed** (verified against
full history). No secret is exposed, and nothing sensitive carries a
`NEXT_PUBLIC_` prefix.

One recommendation: `ANTHROPIC_API_KEY` lives in the app's `.env`. It is a
Claude Code credential, not application config. It is safe today, but a single
accidental `NEXT_PUBLIC_` prefix or a copied `.env` in a deploy would expose it.
**Move it to your shell profile.** Left in place so as not to break tooling.

---

## Security headers — added

`next.config.ts` previously held only `reactCompiler`, so the app shipped with no
CSP, no HSTS, no clickjacking protection and no referrer policy.

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | Scoped allowlist; `object-src 'none'`, `frame-ancestors 'none'`, `form-action 'self'`, `upgrade-insecure-requests` |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | camera, mic, geolocation, payment, USB and sensors all denied |
| `Cross-Origin-Opener-Policy` | `same-origin` |

`poweredByHeader: false` removes the `X-Powered-By: Next.js` fingerprint.

**Known CSP limitation:** `style-src` requires `'unsafe-inline'`. Next injects
critical CSS inline and framer-motion writes inline styles on every animated
element. Tightening it needs a nonce-based CSP threaded through a custom
document — a real change, not a config tweak. `'unsafe-eval'` is scoped to
development only, where React Refresh needs it.

---

## Performance & caching — added

- `images`: AVIF then WebP; `deviceSizes` and `imageSizes` narrowed to the
  breakpoints and rendered sizes this site actually uses; 30-day minimum TTL;
  `dangerouslyAllowSVG: false`.
- `compress: true`.
- `/_next/static/*` → `max-age=31536000, immutable` (content-hashed, so safe).
- `/Logo/*` → `max-age=86400, stale-while-revalidate=604800` (not hashed, so
  revalidate rather than pin).

---

## SEO — added

- **`robots.ts`** — authenticated surfaces (`/admin`, `/dashboard`,
  `/onboarding`, `/team-formation/`, `/api/`) disallowed: a crawler only ever
  gets a redirect, and indexing them advertises the private area's shape. AI
  crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are explicitly
  welcomed to the public pages.
- **`sitemap.ts`** — public routes only. `lastModified` is stamped at build time,
  not per request, so the value is stable rather than changing on every crawl.
- **JSON-LD** (`src/components/seo/StructuredData.tsx`) — `CollegeOrUniversity`
  with `ContactPoint`, `WebSite`, and `FAQPage`. Server-rendered so crawlers that
  do not execute JavaScript still see it. The FAQ schema is generated from the
  same `FAQS` constant the page renders, so the rich result cannot drift from the
  visible content — schema/content mismatch is a manual-action risk.
- Metadata: `metadataBase`, title template, Open Graph, Twitter card, canonical,
  robots directives, icons (added in the earlier pass).

---

## Verified state

```
npx tsc --noEmit     clean
npx next build       clean — 36 routes, /robots.txt and /sitemap.xml registered
npx eslint src       231 problems (222 errors, 9 warnings)
node scripts/contrast.mjs   all shipped text tokens pass
```

Lint is **below** the pre-existing baseline of 233 (222 errors, 11 warnings):
identical error count, two fewer warnings. Zero regressions introduced.

Also confirmed: **0** `console.log` in shipped code, **0** TODO/FIXME/placeholder
comments, **0** hardcoded secret-shaped literals outside `process.env`.

---

## Rate limiting — added

`src/lib/rateLimit.ts`. Login was brute-forceable; account creation was
unbounded.

| Endpoint | Limit | Keyed on |
| --- | --- | --- |
| `POST /api/auth/login` | 10 / min | client IP |
| `POST /api/auth/login` | 5 / 15 min | submitted email |
| `POST /api/auth/signup` | 5 / hour | client IP |

Login is keyed on **both** IP and email. IP alone is spoofable behind an
untrusted proxy; email alone lets a single host spray the whole user table.
Requiring both to stay under budget closes the hole each leaves. Limits are
checked before any database work, so a flood costs nothing.

Responses return `429` with `Retry-After` and `RateLimit-*` headers.

**Also fixed — account-enumeration timing oracle.** The route returned instantly
when no account existed but paid ~300ms of bcrypt when one did, so response time
revealed whether an address was registered. Both miss paths now run a comparison
against a fixed dummy hash (verified: 310ms, matching a real cost-12 compare).

**Signup validation:** minimum password length of 8 is now enforced server-side.

> **Store limitation, stated plainly:** the default store is in-memory. That is
> real protection for a single-instance or self-hosted deployment, but on
> serverless each cold instance keeps its own counters, so a distributed attacker
> gets N× the budget. `RateLimitStore` is a one-method interface and the file
> ends with a ready-to-paste Upstash Redis implementation. Swapping it changes
> nothing else.

---

## Testing & CI — added

`tests/rateLimit.test.ts` — **11 tests, all passing**. Uses Node's built-in test
runner through `tsx`, which was already a devDependency: no Jest, no Vitest, no
new packages. Covers limit enforcement, per-identifier isolation, prefix
collision, window expiry, `Retry-After` bounds, `x-forwarded-for` parsing
(including whitespace and fallback chain), and the 429 header contract.

```bash
npm run typecheck     # tsc --noEmit
npm test              # 11/11
npm run test:contrast # WCAG AA on every shipped token
npm run verify        # all three, exits 0
npm run lint          # separate — see below
```

`.github/workflows/ci.yml` runs typecheck, lint, tests and contrast on every push
and PR, then a production build, then a dependency audit. Concurrency-cancelled
per branch.

Lint is **deliberately excluded from `verify`** and non-gating in CI: 222
pre-existing `no-explicit-any` errors would make it fail permanently, and a gate
that always fails gets ignored. Flip `continue-on-error: false` once that debt is
paid, so new violations cannot land.

ESLint now ignores `.gemini/`, `.agents/`, `.claude/`, `.clerk/` and `.vercel/`.
Those are gitignored agent tooling that was contributing 151 warnings from
vendored third-party scripts and drowning out real findings.

---

## Open — not addressed

Honest scope boundary. These are substantial bodies of work, not oversights:

**Security**
- No CSRF tokens on mutating routes. `sameSite: 'strict'` cookies mitigate but
  do not eliminate.
- No input-validation schema layer (zod) on API routes; validation is ad-hoc.
- No session revocation — a stolen JWT is valid for its full 7 days.
- 3 pre-existing high-severity advisories in `postcss` and `sharp` (transitive
  `next` deps).

**Engineering**
- Test coverage is limited to `src/lib/rateLimit.ts`. No component, integration,
  E2E, a11y or visual-regression tests. The runner and CI are in place, so
  adding them is now incremental rather than foundational.
- No error-reporting integration (Sentry/OpenTelemetry hooks).
- 222 `no-explicit-any` errors, 107 of them in `src/lib/mockDb.ts`.
- `src/app/onboarding/page.tsx` (1855 lines) and `src/app/admin/page.tsx` (1384)
  need component extraction.

**Product / design**
- Design-system **structural** pass not applied: pages have correct type, colour,
  headings and interaction states, but still hand-roll containers and section
  rhythm rather than using `Container`/`Section`/`SectionHeader`, and no
  atmospheres are assigned per page.
- Not built: theme engine / dark mode, command palette (⌘K), global search,
  PWA/offline, i18n + RTL, bookmarking, breadcrumbs, reading progress, analytics
  layer, copy rewrite.

Dark mode specifically remains a **brand decision**: the palette is a light warm
editorial one with no sanctioned dark counterpart, so building one means
inventing brand colours.
