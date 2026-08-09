<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# SIH@GLBGOI Website UI & Design System Guidelines

Strict UI & aesthetic rules for this codebase — prioritize these rules over generic framework defaults:

## 1. Palette & Surfaces (Warm Light Editorial)
- **Base Canvas**: Warm light editorial palette (`#EFE9E1` base canvas, `#F8F6F2` / surface raised).
- **Core Tokens**:
  - Ink (Headings / Primary Copy): `#322D29` (`text-foreground`)
  - Body Copy: `#514840` (`text-body`)
  - Accent (Primary Buttons, Active Links): `#72383D` (`text-accent` / `bg-primary`)
  - Muted Copy: `#6F645B` (`text-muted`)
  - Text on Accent Fills: `#FBF7F4` (`text-on-accent`)
  - Decoration Fills: Sand `#D1C7BD`, Clay `#AC9C8D`, Pearl `#D9D9D9`
- **Banned Fills & Colors**:
  - DO NOT invent or apply a dark mode / dark SaaS theme (the website uses a warm light editorial style).
  - DO NOT use `#AC9C8D` (clay) as text color (fails contrast). Fills/borders only.
  - DO NOT use alpha-modified text classes (`text-muted/80`, `text-foreground/50`). Use `text-muted` or `text-body`.
  - DO NOT hardcode raw hex color literals outside `tokens.css` / design tokens.

## 2. Typography & Hierarchy
- **Font Scale**: Fluid type scale (`text-display`, `text-title`, `text-heading`, `text-subheading`, `text-feature`, `text-base`, `text-caption`, `text-label`).
- **Minimum Floor**: No font size below 12px (`text-label`).
- **Font Weights**: Headings sit at weight **600** with negative tracking. Avoid `font-extrabold` (800).

## 3. Icons & Imagery
- **Lucide Icons Only**: All UI icons must use Lucide React icons with `strokeWidth={1.75}` (or standard size classes).
- **Zero Emoji**: No raw emoji in UI components or buttons (use Lucide icons like `Terminal`, `Code2`, `Palette`, `Crown`, `Check`, `Bell`).

## 4. Components & Elevation
- **Card Fills & Borders**: Multi-layered depth with warm shadows (`shadow-e1` through `shadow-e5`), hairline warm borders (`border-[rgba(209,199,189,0.6)]`), and smooth `framer-motion` transitions.
- **Buttons**: Use standard `PremiumButton` or styled magnetic pills with `bg-primary text-on-accent` or outlined `border-[rgba(209,199,189,0.7)] bg-white/40`.

