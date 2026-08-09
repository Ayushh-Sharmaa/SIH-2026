# NexaSphere — Design Direction

This is a living direction doc, not a locked spec. The exact animation/scroll treatment is still being decided (candidates being explored: Figma prototypes, Stitch). What's fixed below is the theme direction; what's open is flagged as open.

---

## 1. Theme — Fixed Direction

**Dark, not white.** Two acceptable directions, either is on-brand — pick one and commit before Phase 4 polish:

**Option A — Dark Metallic**
A dark base that has *shine* to it rather than flat black — think brushed steel / gunmetal with light catching on edges. Achieved through:
- Subtle gradients on cards/panels (dark grey → slightly lighter grey diagonal sheen) rather than flat fills.
- A metallic accent (chrome/silver or cool steel-blue) used sparingly on borders, icons, and hover states.
- Glassmorphism-adjacent surfaces: low-opacity panels with a soft inner highlight to suggest a reflective, machined surface.

**Option B — Dark Palette (non-metallic)**
A flat, confident dark UI built around a cohesive dark color system rather than a shine effect:
- Deep charcoal/near-black base (`#0D0F12`–`#121417` range) with layered surface tones for elevation (cards sit on a lighter dark than the page background).
- One saturated accent color carries all interactive elements (primary buttons, links, active states) so the palette stays disciplined rather than busy.

**Recommendation:** prototype both in Figma against one real screen (`/find-teammates` is a good test — it has cards, filters, and states) before committing, since "metallic shine" only reads well with the right accent and lighting choices and can look cheap if overdone.

### Base palette (works for either option)

| Token | Use | Value (starting point) |
|---|---|---|
| `--bg-base` | Page background | `#0D0F12` |
| `--bg-surface` | Cards, panels | `#16191D` |
| `--bg-surface-raised` | Modals, dropdowns | `#1E2227` |
| `--border` | Dividers, card outlines | `#2A2F36` |
| `--text-primary` | Headings, body | `#F2F3F5` |
| `--text-secondary` | Meta text, labels | `#9AA1AB` |
| `--accent` | Primary actions, links, active states | *TBD — pick one saturated color; steel-blue or electric teal both suit a dark-metallic direction* |
| `--accent-metallic` | Shine/highlight (Option A only) | Silver/chrome gradient, e.g. `linear-gradient(135deg, #C8CCD1, #6B7280)` |
| `--success` / `--warning` / `--danger` | Status states (team full, mentor unavailable, error) | Standard semantic greens/ambers/reds, muted to sit well on dark |

---

## 2. Typography

- **Headings:** a clean geometric sans with some character — candidates: **Space Grotesk**, **General Sans**, or **Sora**. All read as modern/technical without being generic, and pair well with a dark-metallic surface.
- **Body/UI text:** a highly legible workhorse sans for dense UI (filters, cards, forms) — **Inter** or **IBM Plex Sans**. Inter is the safe, proven choice for data-dense screens like `/find-teammates`.
- **Monospace (optional accent):** for skill tags or track codes (e.g. `PS-2026-047`), a mono font like **JetBrains Mono** adds a technical feel that fits the SIH/hackathon context.

**Scale (starting point, 4/8pt-ish rhythm):**
- H1: 32–40px / bold
- H2: 24–28px / semibold
- H3: 18–20px / semibold
- Body: 15–16px / regular
- Small/meta: 13px / regular, `--text-secondary`

---

## 3. Motion & Scroll — Open

Not yet decided which approach fits best; being explored through Figma prototyping and Stitch. Things worth testing once a direction is picked:
- Subtle scroll-triggered reveals on the landing page (sections fading/sliding in) — keep it restrained so it doesn't fight the dark-metallic surface treatment.
- Micro-interactions on interactive elements that matter for this product specifically: card hover states on team/mentor cards, a satisfying state-change animation when an invite is accepted, skeleton loading states for AI agent responses (since those calls aren't instant).
- Avoid heavy parallax or scroll-jacking — this is a utility product (finding teammates fast matters more than a cinematic landing page).

**Action item:** once a Figma/Stitch prototype is chosen, record the decision and any resulting design tokens back into this file.

---

## 4. Component Feel

- Cards (team cards, mentor cards, student cards) are the core repeated UI element — they deserve the most design attention. They surface the name, key skills or expertise, and relevant status at a glance.
- Buttons: one clear primary style (accent-filled), one secondary (outlined/ghost) — avoid a third tier unless a real need shows up.
- Status/badges (team status and verified mentor) use small pill-shaped tags with the semantic color tokens above. Mentor guidance counts are informational, never a disabled-state threshold.
- Forms (onboarding, profile edit) should feel low-friction — multi-step with clear progress, not one long scroll of fields.

---

## 5. Reference/Inspiration Direction

Look toward dark-first developer/technical tools for tone rather than generic SaaS templates — the kind of interfaces that feel "built for builders": think Linear, Vercel's dashboard, Raycast. These share the dark-surface, high-contrast-accent, minimal-chrome feel that fits a hackathon-tooling product without tipping into "gamer RGB" territory.
