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

## Runtime performance — the reported latency

The site was reported as laggy, with stuttering animation and slow interactions.
The audit found four distinct causes, all in the root layout, all fixed.

### 1. Four concurrent `requestAnimationFrame` loops — fixed

`SmoothScroll` (Lenis), `CustomCursor`, `ScrollProgress` (framer's `useSpring`)
and framer's own driver each opened an independent, permanent loop. Every frame
paid four separate JS entry points and four chances to miss the 16.6ms budget.
None stopped when idle, so a parked tab with no pointer movement and no
scrolling still burned a full rAF cycle indefinitely.

Replaced by `src/lib/ticker.ts`: one loop, shared. It starts on the first
subscriber, stops on the last, suspends entirely when the document is hidden,
and hands every subscriber the same clamped delta so two animations can never
disagree about how much time passed. A subscriber that throws is evicted rather
than taking the loop down. 10 tests in `tests/ticker.test.ts` pin the behaviour.

### 2. Every navigation cost 500ms of dead time — fixed

`PageTransition` used `<AnimatePresence mode="wait">`, which holds the incoming
page until the outgoing one finishes its 500ms exit. The new page was already
fetched and ready to paint; it was simply not allowed to. This was the single
largest source of the "slow interactions".

Two further defects in the same component:

- It animated `y`, `scale` and `filter` on a wrapper containing the navbar. Any
  of `transform`, `filter` or `perspective` makes an element the containing
  block for `position: fixed` descendants, so for the length of every transition
  the fixed navbar silently stopped being viewport-fixed and rode along with the
  page. Now animates `opacity` alone, which creates a stacking context but not a
  containing block.
- Animating `filter: blur()` across a full-viewport subtree forces a re-raster
  of the entire document every frame — the cause of the stutter on route change.

It also called `window.scrollTo({ top: 0 })` on every pathname change, which
defeated the App Router's own scroll restoration: the back button always dumped
the user at the top of the page they returned to. Removed.

The first render deliberately does not animate. Fading in from `opacity: 0` on a
cold load would push LCP out by the full animation duration.

### 3. The boot curtain gated LCP and caused layout shift — fixed

`LoadingScreen` held for a flat 1500ms and then faded for 700ms. LCP is the last
contentful paint before first interaction, so hiding the hero until t=1500ms put
a hard floor of ~2.2s under LCP on its own. The hold is now bounded by actual
readiness (`load` + `document.fonts.ready`) with a 550ms floor to avoid a flash
and a 1200ms ceiling so a stalled font can never strand the user.

It also set `overflow: hidden` on the body, which removes the scrollbar, widens
the layout viewport and reflows the page — a CLS event on load and a second one
on release. The lock bought nothing: the curtain is `fixed inset-0` and already
covered everything scrollable. Removed.

Its exit animated `filter: blur(12px)` full-screen; now opacity and scale, which
composite on the GPU.

### 4. Cursor hit-testing ran on every pointer event — fixed

`CustomCursor` ran three `closest()` ancestor walks inside its `pointermove`
handler. That event fires once per hardware report — 125Hz on a plain mouse, up
to 1000Hz on a gaming mouse — so up to a thousand DOM traversals a second, all
but sixty discarded before anything could paint. Hit-testing now happens once
per frame, where the result can be used.

Also fixed in the same component: the trail canvas cleared the **whole viewport**
every frame to paint ten small dots, dirtying every pixel on screen; it now
clears only the rectangle the trail occupied. And its backing store was sized in
CSS pixels, so the trail rendered at half resolution on every retina display.

### 5. Scroll progress moved off the main thread — fixed

`ScrollProgress` used framer's `useScroll` + `useSpring` — a spring solver
stepping every frame to drive one `scaleX`. Where the browser supports
scroll-driven animations it is now pure CSS (`animation-timeline: scroll(root
block)`), which runs on the compositor and is correct before React hydrates. The
component now only exists to cover Safari and Firefox, where it installs a single
passive listener that coalesces writes into one per painted frame.

### 6. The session refetched on every navigation — fixed

`Navbar` called `/api/auth/me` from an effect keyed on `pathname`, so every
client-side navigation put a network request on the critical path for data that
had not changed, and the identity block dropped back to its shimmer skeleton
each time — the user's own name blinked out on every page they opened.

`src/lib/session.tsx` fetches once per page load and is invalidated explicitly.
Because the provider survives navigation, every post-authentication redirect must
invalidate it; `useAuthenticatedRedirect` does that in one place, shared by the
four form components across the sign-in and sign-up pages.

### 7. Cursor code shipped to devices that could never use it — fixed

`CustomCursor` refused to run on touch and under reduced motion, but only after
being downloaded, parsed and hydrated. `PointerChrome` moves it behind a lazy
import gated on `(hover: hover) and (pointer: fine)` and the reduced-motion
query, both watched rather than sampled once. Phone visitors now fetch nothing.

---

## Bundle: LazyMotion migration — done, and it did not pay off

`motion.div` cannot be tree-shaken: importing it pulls drag, layout projection,
pan gestures, SVG path animation and scroll into the bundle whether a page uses
them or not. All 24 files that imported it therefore carried the whole library.

Migrated to `LazyMotion` + the bare `m` component, with features supplied once in
`MotionProvider`. 253 call sites across 25 files. `strict` is enabled, which
makes any surviving `motion.*` throw — and since all 36 routes are statically
generated, `next build` renders every one of them and turns that runtime guard
into a build-time one. The build is clean, so the migration is complete.

**Measured result: no saving.**

| | raw | gzipped | files |
| --- | --- | --- | --- |
| Before | 1558.6 KB | 507.3 KB | 39 |
| After | 1559.6 KB | 508.7 KB | 40 |

The framer chunk did drop from 140.0 KB to 85.2 KB, but an equivalent feature
chunk appeared alongside it. The reason is `domMax`: it contains layout
projection plus drag plus every DOM animation feature, which is very nearly the
whole library. Restructuring where those bytes live does not remove them.

`domMax` is not optional today. Seven `layoutId` shared-layout pills — navbar,
tracks filter, admin tabs, onboarding stepper, signup role selector, landing
phase list — are layout animations, and layout projection ships only in
`domMax`. `domAnimation`, the small feature set, would silently turn all seven
into hard cuts.

**What would actually move the number**, in descending order of value:

1. **Rebuild the seven `layoutId` pills as CSS transitions** and drop to
   `domAnimation`. Layout projection is the single heaviest part of the library.
   Costs a signature interaction — the pill that morphs between nav items — so
   this is a design call, not purely an engineering one.
2. **Async features**: `features={() => import(...).then(r => r.domMax)}` moves
   the feature bundle off the critical path. Total bytes are unchanged but the
   initial parse shrinks. Not done, because `Reveal` renders its children at
   `opacity: 0` until features arrive: if that chunk ever fails to load, page
   content stays permanently invisible. That is a poor trade for parse time.
3. **Server Components for the landing page** — see below. Much larger win than
   either of the above.

The migration is kept despite the null result: `strict` makes it impossible for
a future file to import the full bundle *alongside* this one, which would be
strictly worse than never having done it, and it is the prerequisite for both
options above.

---

## Logging and observability — added

`src/lib/logger.ts` replaces 44 bare `console.error` calls across API routes and
client components. Three problems with what was there:

- **They shipped to the browser.** Every `console.error` in a client component
  runs in the user's devtools, handing over a map of internal failure modes and
  endpoint names.
- **They logged whole error objects.** `console.error('Login error:', error)` on
  a driver failure prints the failing query, and a query can contain an email
  address or a password hash. Server logs are routinely shipped to third-party
  aggregators, so that is a real disclosure path.
- **Nothing was watching.** A production failure was only discovered when a user
  reported it.

The logger redacts a keyword list (`password`, `token`, `secret`, `session`,
`hash`, …) from context before writing, drops error messages and stacks entirely
on the client, emits one structured JSON line per record on the server, and stays
fully verbose in development. `setErrorReporter` is the single attachment point
for Sentry, Rollbar, Datadog or OpenTelemetry; records reaching it are already
redacted, so a reporter can forward them verbatim. A throwing reporter is
swallowed — a monitoring integration must never fail the request it is observing.

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
