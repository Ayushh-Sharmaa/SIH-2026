# UI & Design System

This document outlines the **Warm Light Editorial** design system, color tokens, typography scale, component surfaces, and accessibility standards for **SIH@GLBGOI**.

---

## 1. The Core Design Philosophy

SIH@GLBGOI uses a **Warm Light Editorial** aesthetic inspired by academic publishing and modern engineering tools.

### The Golden Rule
> **No file outside `src/styles/tokens.css` may introduce raw hex color literals, custom border radii, or ad-hoc animation timings.** All styles must read from the unified design token layer.

---

## 2. Color Palette & Contrast Tokens

### Brand Palette

| Token | Hex | Role | Contrast on Canvas |
| :--- | :--- | :--- | :--- |
| `--color-ink` | `#322D29` | Primary headings & emphasis | **11.29:1** (AAA) |
| `--color-body` | `#514840` | Sustained body copy | **7.41:1** (AAA) |
| `--color-accent` | `#72383D` | Primary buttons & active accents | **7.41:1** (AAA) |
| `--color-muted` | `#6F645B` | Secondary labels & metadata | **4.77:1** (AA) |
| `--color-canvas` | `#EFE9E1` | Base canvas background | Baseline |
| `--color-sand` | `#D1C7BD` | Subtle card & input borders | Decorative |
| `--color-clay` | `#AC9C8D` | Decorative fills & gradients | **Banned for text** |
| `--color-pearl` | `#D9D9D9` | Accent fills & avatars | Decorative |

> [!IMPORTANT]
> **Prohibited Practices**:
> * **No Dark Mode**: The platform is strictly a calibrated warm-light editorial interface.
> * **No Clay Text**: `#AC9C8D` measures 2.21:1 on canvas and is banned as a text color.
> * **No Alpha Text**: Alpha-modified text classes (e.g. `text-muted/80`, `text-foreground/50`) are prohibited because opacity destroys contrast predictability.

---

## 3. Typography & Fluid Scale

The typography scale utilizes modern sans-serif typography with negative letter-tracking on headings and high legibility across all viewport sizes:

| Token Class | Use Case | Weight |
| :--- | :--- | :--- |
| `text-display` | Major page banners & hero titles | 700 / Bold |
| `text-title` | Section titles & directory headers | 600 / SemiBold |
| `text-heading` | Card group headings | 600 / SemiBold |
| `text-feature` | Card titles & interactive elements | 600 / SemiBold |
| `text-base` | Standard body paragraphs | 400 / Regular |
| `text-caption` | Metadata, badges, and status text | 500 / Medium |
| `text-label` | Uppercase filter tags & section eyebrows | 700 / Bold (Min 12px) |

---

## 4. Surfaces & Depth System

Depth is achieved through multi-layered signals (translucent fills, hairline borders, inset light highlights, and warm shadows) rather than raw drop-shadows:

* `.surface-raised`: The standard card material with top bevel reflection (`var(--shadow-e2)`).
* `.surface-glass`: Floated navigation chrome with backdrop blur (`backdrop-filter: blur(20px)`).
* `.surface-sunken`: Inset wells and search background panels (`var(--shadow-inset)`).
* `.surface-overlay`: Modals, dialogs, and flyout menus (`var(--shadow-e5)`).

---

## 5. Iconography & Interaction Rules

* **Lucide React Icons Only**: UI icons use Lucide icons with consistent `strokeWidth={1.75}` (e.g., `Search`, `Users`, `Briefcase`, `ShieldCheck`, `GraduationCap`).
* **Zero Emoji in UI**: Raw emojis are prohibited in system components, action buttons, and status indicators.
* **Component Elevation**: Cards utilize `SpotlightCard` for cursor-following highlights and `TiltCard` for micro-interaction physics.

---

## 6. Accessibility & Contrast Verification

Every color pairing in the design system is verified automatically via `npm run test:contrast`:
* All body copy meets or exceeds **4.5:1** WCAG AA standards.
* All large headings meet or exceed **3.0:1** WCAG AA standards.
* Keyboard focus indicators utilize a high-contrast accent ring (`:focus-visible`).

---

[← Security & Privacy](Security-and-Privacy) • [Next: Testing & Verification →](Testing-and-Verification)
