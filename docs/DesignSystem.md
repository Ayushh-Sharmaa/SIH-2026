# SIH@GLBGOI — Design System

One system, six colours, one type scale, one motion language.

Everything below is implemented. `src/styles/tokens.css` is the single source of
truth; if a value is not there, it does not exist.

---

## The one rule

**No file outside `tokens.css` may introduce a raw colour, radius, shadow,
duration, or type size.** If a value is needed and missing, add it to
`tokens.css` first, then use the token.

This exists because the audit found what happens without it:

| Dimension | Distinct raw values found |
| --- | --- |
| Colour literals | **182** (161 raw literals across 557 occurrences) |
| Radius / border / shadow | **100** (33 distinct box-shadows, all single-layer) |
| Spacing | **155** (no spacing layer existed at all) |
| Motion | **89** |
| Typography | **47** (the micro-label alone was spelled **18 different ways**) |

---

## 1. Colour

### Brand — fixed, never extended

| Token | Hex | Role |
| --- | --- | --- |
| `--color-ink` | `#322D29` | Primary heading |
| `--color-accent` | `#72383D` | Secondary heading / accent |
| `--color-canvas` | `#EFE9E1` | Interface base |
| `--color-pearl` | `#D9D9D9` | Interface |
| `--color-sand` | `#D1C7BD` | Interface |
| `--color-clay` | `#AC9C8D` | Interface |

### `#AC9C8D` is banned as a text colour

It was the site-wide body-text colour (`text-muted`, **79 usages**) and measures
**2.21:1** on canvas. AA requires 4.5:1. It fails on every surface in the
palette — including against itself.

It survives only as **decoration**: fills, gradients, blob tints, dividers.

### The text ramp

Derived by mixing ink toward clay, so every tone stays in family. Verify with
`node scripts/contrast.mjs`.

| Token | Hex | On canvas | Use |
| --- | --- | --- | --- |
| `text-foreground` | `#322D29` | **11.29:1** | Headings, primary copy |
| `text-body` | `#514840` | **7.41:1** | Sustained reading |
| `text-accent` | `#72383D` | **7.41:1** | Accent copy, links |
| `text-muted` | `#6F645B` | **4.77:1** | Secondary copy, meta |
| `text-faint` | `#877B6F` | **3.42:1** | **Large text / UI only** (≥18.66px bold or ≥24px) |
| `text-on-accent` | `#FBF7F4` | 8.39:1 *(on accent)* | Text over an accent fill |

Redefining `--color-muted` fixed contrast on every page at once, with no page
edits, because `text-muted` was already a token.

### Never use alpha-modified text

Opacity on a text colour is not safe. Measured over canvas:

| Class | Result | Verdict |
| --- | --- | --- |
| `text-muted/80` | 3.25:1 | large text only |
| `text-muted/70` | 2.74:1 | **fails** |
| `text-foreground/65` | 4.13:1 | **fails body** (16 usages) |
| `text-foreground/60` | 3.61:1 | **fails body** (20 usages) |
| `text-foreground/55` | 3.16:1 | **fails body** (16 usages) |
| `text-foreground/50` | 2.79:1 | **fails** (9 usages) |

Use `text-muted` or `text-faint`. Those 61 alpha usages are queued for
replacement during page application.

### Surfaces and borders

Depth comes from veiling the palette with controlled white, not from new hues.

`--color-surface-raised` · `-overlay` · `-sunken` · `-veil`, each with an opaque
`-solid` fallback for contexts without `backdrop-filter`.

Four border tokens replace ~20 near-identical rgba values:
`--color-line-subtle` · `--color-line` · `--color-line-strong` · `--color-line-accent`.

### Off-palette colours to remove

`#F8F6F2` (old `--card`), `#FBF9F6`, `#8F464C`, `#F5F1EC`. Flagged during page
application.

### Dark mode

Not implemented, and deliberately so — the palette is a light, warm, editorial
one with no sanctioned dark counterpart. Inventing one would mean inventing
brand colours. Raise it as a brand decision, not an engineering one.

---

## 2. Typography

One class carries size + line-height + letter-spacing + weight. `text-title` is
a complete type style, not just a size.

| Token | Fluid range | Weight | Tracking | Use |
| --- | --- | --- | --- | --- |
| `text-display` | 44 → 96px | 600 | −0.042em | Hero |
| `text-title` | 36 → 64px | 600 | −0.036em | Page `h1` |
| `text-heading` | 28 → 48px | 600 | −0.030em | Section `h2` |
| `text-subheading` | 22 → 32px | 600 | −0.022em | `h3` |
| `text-feature` | 18 → 22px | 600 | −0.014em | Card titles |
| `text-lead` | 17 → 20px | 400 | −0.008em | Section descriptions |
| `text-base` | 16px | 400 | — | Body |
| `text-caption` | 13px | 400 | — | Meta |
| `text-label` | 12px | 600 | +0.09em | Uppercase micro-label |

All fluid sizes use `clamp()` between 375px and 1440px viewports — no stepped
`sm:`/`lg:` ladders.

### 12px floor

The site had **140 instances** below 12px: 7px (×1), 9px (×8), 10px (×82),
11px (×49). All collapse to `text-label`.

### Weight discipline

`font-extrabold` (800) was used throughout. Headings now sit at **600** with
tight negative tracking — the Apple/Linear/Stripe register. 800 is gone.

### Measure

Descriptions cap at `--container-prose` (68ch). `SectionHeader` enforces this;
only one paragraph in the entire original codebase constrained measure at all.

---

## 3. Spacing, layout, grid

8-point grid via Tailwind's `--spacing` base.

**Section rhythm** — fluid, and alternating them is what stops a page feeling
metronomic (five of the eight home-page sections were identical `py-24 sm:py-32`):

- `py-section-compact` 48 → 80px
- `py-section` 72 → 128px
- `py-section-spacious` 96 → 176px

**Containers** — `<Container width="…">` replaces `mx-auto max-w-7xl px-6 lg:px-8`:

| Width | Size | Use |
| --- | --- | --- |
| `prose` | 68ch | Long-form text |
| `narrow` | 768px | Forms, auth |
| `content` | 1152px | Default |
| `wide` | 1440px | Dashboards, tables |
| `full` | 1920px | Ultra-wide ceiling |

Gutters are fluid (20 → 40px). A `3xl` breakpoint (1920px) was added; the site
previously had no `2xl:` treatment anywhere and capped at 1280px.

---

## 4. Shape and elevation

### Radius

Tailwind's numeric scale is **retargeted** onto the 8/16/20/28/32 grid, so every
existing `rounded-*` class lands on-system with no markup change:

| Class | Was | Now |
| --- | --- | --- |
| `rounded-lg` | 8px | 8px |
| `rounded-xl` | 12px | **16px** |
| `rounded-2xl` | 16px | **20px** |
| `rounded-3xl` | 24px | **28px** |
| `rounded-4xl` | 32px | 32px |

New code should prefer the semantic aliases: `rounded-control` (8) ·
`rounded-panel` (16) · `rounded-card` (20) · `rounded-container` (28) ·
`rounded-hero` (32) · `rounded-pill`.

### Elevation

Five layered steps (`shadow-e1` … `shadow-e5`) plus `shadow-accent` and
`shadow-inset`, absorbing all 33 ad-hoc shadows. Every step is **two shadows** —
a tight contact shadow plus a wide ambient one. Every previous shadow in the app
was single-layer, which is why cards read flat. Base is warm neutral
`rgb(50 45 41 / …)`, never black.

---

## 5. Motion

`src/components/motion/tokens.ts` mirrors the CSS tokens one-for-one. CSS owns
ambient and looping motion; Framer Motion owns stateful and interruptible motion.

| Token | Value | Band |
| --- | --- | --- |
| `instant` | 100ms | micro 100–150 |
| `micro` | 140ms | micro |
| `hover` | 200ms | hover 180–250 |
| `control` | 220ms | button 180–220 |
| `card` | **320ms** | card 250–350 *(was 400ms, out of band, 28 call sites)* |
| `reveal` | 560ms | reveal 400–700 |
| `page` | 560ms | route 450–650 |
| `hero` | 900ms | hero 800–1200 |

**Easing** — `outExpo` (house curve) · `outQuint` · `inOut` · `outBack`. Nothing
uses `linear` except continuous loops, where constant velocity is the point.

**Springs** — `soft` · `snappy` · `magnetic` · `overlay`. Preferred for anything
pointer-tracked or interruptible, because a spring re-targets gracefully where a
tween restarts.

**Stagger** — `tight` 0.04 (8+ items) · `normal` 0.07 · `relaxed` 0.11. Pick by
list length: 12 items at 0.08s takes a full second to finish and reads sluggish.

**Variants** — `fade` · `fadeUp` · `blurUp` (house reveal) · `scaleIn` ·
`depthIn` · `maskUp` · `slideFrom()`. All carry `exit` states.

### Reduced motion

`<MotionProvider>` in the root layout sets `reducedMotion="user"`. This was the
single largest accessibility gap: Framer Motion was never told about the
preference, so all 76 transitions ran at full amplitude regardless of OS setting.
The CSS media query cannot reach JS-driven animation.

Note `reducedMotion="user"` suppresses transform and layout but **not `filter`**
— so components using blur still branch explicitly.

---

## 6. Surfaces, patterns, atmospheres

Depth is four stacked signals, never a shadow alone:

1. translucent fill (the material)
2. hairline border (the edge)
3. **inset top highlight** (light on the top bevel)
4. layered outer shadow (the cast)

Signal 3 is what separates convincing glass from a blurred rectangle.

**Materials** — `.surface-raised` · `.surface-glass` · `.surface-overlay` ·
`.surface-sunken` · `.surface-taupe`. Add `.lift` / `.lift-lg` for hover
elevation (pointer-only — a lift that never resolves is noise on touch).

**Patterns** — `dots` · `grid` · `mesh` · `rays` · `contour` · film grain.

**Atmospheres** — `dawn` · `mist` · `dune` · `linen` · `quarry` · `ember` ·
`vellum` · `slate`.

```tsx
<Section tone="quarry" rhythm="spacious" pattern="mesh">
  <Container>
    <SectionHeader eyebrow="Themes" title="All 18 official SIH tracks" />
  </Container>
</Section>
```

> **House rule: adjacent sections must not share a `tone`.**
> 8 tones × 4 rhythms × 6 patterns = 192 compositions, all built from the same
> six colours. Variety is enumerated, not improvised.

**Dividers** never terminate hard: `line` · `soft` · `glow` · `wave` · `arc`.

---

## 7. Icons

**Lucide only. Stroke 1.75. Zero emoji.**

1.75 sits between Lucide's default 2 (heavy beside a 600-weight heading) and 1.5
(weak below 20px). The site previously hand-rolled inline SVG at four stroke
widths — 1.6 / 1.7 / 2 / 2.4 — with the arrow-right path duplicated verbatim
across files. Mixed stroke weights are the clearest tell of an unsystematised UI.

Sizes tie to the type scale: `xs` 14 · `sm` 16 · `md` 20 · `lg` 24 · `xl` 32 ·
`2xl` 40.

**Accessibility contract:** icons are decorative and `aria-hidden` by default.
Pass `label` only when the icon is the sole carrier of meaning — an icon beside
a text label must stay decorative or screen readers announce it twice.

### Removed

13 emoji, including the dashboard role avatars (🥷 💻 🎨 🧪 👑 ✍️ → `Terminal`,
`Code2`, `Palette`, `FlaskConical`, `Crown`, `PenLine`) and 15 decorative
unicode arrows (`↗` `→`) used as UI.

---

## 8. Z-layers

Replaces ad-hoc `z-[100000]` / `z-99999` / `z-99998`:

`z-decor` 1 · `z-content` 10 · `z-sticky` 20 · `z-nav` 50 · `z-overlay` 100 ·
`z-modal` 200 · `z-toast` 300 · `z-cursor` 400 · `z-boot` 500

---

## 9. Cascade layers — load-bearing

```css
@import '../styles/base.css' layer(base);
@import '../styles/surfaces.css' layer(components);
```

Tailwind emits `@layer theme, base, components, utilities`. **Unlayered rules
beat every layered rule regardless of specificity** — so an unlayered
`.surface-raised { box-shadow }` silently defeats `shadow-e3` on the same
element. That was a live bug in the original `globals.css`. Assigning each file
to its layer is what keeps utilities able to override components.

`tokens.css` stays unlayered: `@theme` must not be inside a layer.

---

## Verifying

```bash
node scripts/contrast.mjs   # every text token against every surface
npx tsc --noEmit            # clean
npx next build              # clean
```

---

## Status

**Done** — token foundation; layered CSS architecture; accessible text ramp;
type scale; 8pt spacing + containers + `3xl` breakpoint; retargeted radius;
layered elevation; motion tokens + variant library; `MotionProvider`; surface,
pattern and atmosphere system; `Container` / `Section` / `SectionHeader` /
`Eyebrow` / `Divider` / `Icon` primitives; icon system; zero emoji; production
metadata; ~45% dead CSS removed.

**Next — applying the system page by page.** The foundation is in place and the
build is green, but most pages still carry their original markup:

- 61 alpha-modified text usages to replace
- Heading-order violations on nearly every page (`login` renders `h2` before its
  `h1`; `dashboard` has zero `h2`; `tracks` has one heading total)
- The only modal (`admin`) has no focus trap, no Escape, no scroll lock, no
  focus return
- Four duplicate toast implementations (`dashboard`, `admin`, `find-mentors`,
  `find-teammates`)
- Empty states missing on five admin surfaces; four pages swallow fetch errors
  into `console.error` with no user-facing surface
- Navbar height has four conflicting definitions
- `onboarding` (1855 lines) and `admin` (1384 lines) need component extraction
- No `loading.tsx` / `error.tsx` / `not-found.tsx` anywhere
- `framer-motion` and `motion` are both installed — the same library twice
