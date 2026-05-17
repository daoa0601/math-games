# Design System — Strict Enforcement

This document is **load-bearing**. Future agents adding new games or UI must follow it. The visual language was carefully built across four phases of work in May 2026; deviations compound into "AI-generated dashboard" smell that took deliberate effort to avoid.

## Aesthetic Direction

**Editorial / handcrafted, with indie-game (Mini Metro, Monument Valley) restraint.** Bold geometric primitives used confidently and sparingly. Per-game color identity carried by tinted gradient + custom glyph, not by chrome decoration. Generous negative space. Tasteful typography.

## Foundation Components (`packages/ui/`)

Use these. Do not roll your own equivalents.

| Component | Purpose | Source |
|-----------|---------|--------|
| `<Wordmark label compact? />` | "Math Games" + connected-dots glyph. `compact` for breadcrumbs. | [packages/ui/src/wordmark.tsx](../packages/ui/src/wordmark.tsx) |
| `<GameGlyph game />` | Per-game custom SVG. 4 hand-drawn primitives (constellation / podium / split-triangle / dotted-gap). | [packages/ui/src/game-glyph.tsx](../packages/ui/src/game-glyph.tsx) |
| `<MechanicCard game tone? showGlyph? showPattern? />` | Themed card with `--game-gradient` bg, optional `GamePattern` watermark, anchored `GameGlyph`. **Decorative chrome only — never wrap a playfield in this.** | [packages/ui/src/mechanic-card.tsx](../packages/ui/src/mechanic-card.tsx) |
| `<GameChrome game levelTitle meta? />` | Sticky game-page header with wordmark/breadcrumb/glyph/title. Includes `LanguageToggle`+`ThemeToggle`. Use in every game route — do not roll your own header. | [packages/ui/src/game-chrome.tsx](../packages/ui/src/game-chrome.tsx) |
| `<PlayerAvatar seed />` | Deterministic 2-shape geometric avatar from a seed string (typically `displayName`). | [packages/ui/src/player-avatar.tsx](../packages/ui/src/player-avatar.tsx) |
| `<RaritySigil rarity locked? />` | Achievement icon — geometric primitive per rarity (circle/square/triangle/hexagon), filled vs outline. | [packages/ui/src/rarity-sigil.tsx](../packages/ui/src/rarity-sigil.tsx) |
| `<GamePattern pattern />` | Tiled SVG pattern watermark. **For non-gameplay surfaces only.** | [packages/ui/src/game-pattern.tsx](../packages/ui/src/game-pattern.tsx) |

## Design Tokens (`apps/web/src/styles.css`)

Use these instead of raw Tailwind colors or hard-coded values.

| Token | Use |
|-------|-----|
| `--card-shadow-long` | All elevated cards. Replaces `shadow-xl`, `shadow-lg`, multi-layer shadows. |
| `--game-gradient` | Card background tint per game. Already authored per theme. |
| `--game-gradient-soft` | Lighter variant. Use when more than ~6 tinted surfaces would be on screen. |
| `--success` | Correct/solved state. Replaces raw `bg-green-500/X`. |
| `--destructive` | Wrong/error state. Already a Tailwind utility (`text-destructive`, `bg-destructive`). |
| `--chart-1/2/3` | Per-game accent palette. For confetti and small UI accents. |
| `--rank-gold` | Legendary rarity color. |
| `--line-correct` / `--line-incorrect` / `--line-pending` | In-game state colors for puzzle elements. |

## DO

When adding a new game (or new UI):

1. **Add game ID** to the `GameGlyphId` union in [`packages/ui/src/game-glyph.tsx`](../packages/ui/src/game-glyph.tsx). Add a custom hand-drawn SVG (3-5 primitives, `currentColor`, slight imperfection, `stroke-linejoin: round`).
2. **Add theme block** in [`apps/web/src/styles.css`](../apps/web/src/styles.css) under the `/* GAME THEMES */` section. Both `.theme-<id>` and `.dark .theme-<id>` need: `--primary`, `--primary-foreground`, `--accent`, `--ring`, `--glow`, `--chart-1/2/3`, `--game-gradient`, `--game-gradient-soft`.
3. **Add pattern mapping** in `MechanicCard.GAME_PATTERN` for the new game — pick one of `triangles | constellation | arrows | grid | blueprint | magnifier` or add a new one in [`packages/ui/src/game-pattern.tsx`](../packages/ui/src/game-pattern.tsx).
4. **Route header**: use `<GameChrome game={...} levelTitle={...} />`. Don't write your own sticky header.
5. **Route wrapper**: apply `theme-<gameid>` class to `<main>`.
6. **Playfield card**: use `<Card className="game-card-bg relative overflow-hidden border-0">`. The `.game-card-bg` class pulls `--game-gradient` automatically.
7. **Sidebar/controls cards**: `border border-border/60 shadow-(--card-shadow-long)`.
8. **Hint cards**: `border border-primary/15 bg-primary/[0.04] shadow-none`.
9. **Modals**: overlay `bg-foreground/30 p-4 animate-slide-up-fade`, card `animate-scale-in shadow-(--card-shadow-long) border border-destructive/30`.
10. **Confetti**: pass a palette of 4-5 hex values **harmonized with the theme's hue family** (look at the OKLCH `--primary` H value; sequence-race ≈ 25, magic-graph ≈ 290, shape-architect ≈ 170, pattern-detective ≈ 70). Do not reuse rainbow defaults.
11. **State colors**: success → `text-success`/`bg-success`. Error → `text-destructive`/`bg-destructive`. Never raw Tailwind palette colors like `green-500`, `blue-500`.
12. **Tabular numbers**: any number that updates (scores, counts, dates, levels) gets `tabular-nums`.
13. **Typography**: titles use `font-display` (Rubik) + `font-medium tracking-tight`. Body stays Geist (default).

## DO NOT

These have specific reasons. Don't relitigate.

- **No `GamePattern` watermark inside a playfield card.** The pattern competes with the puzzle's own geometric primitives. (User feedback, May 2026.)
- **No glassmorphism / `backdrop-blur`.** Solid `bg-background` only.
- **No Lucide / Heroicons / icon-pack imports** for game or rank glyphs. Hand-draw SVGs. (`lucide-react` is in deps for non-glyph chrome only.)
- **No scale-up hover** on cards or chrome (`hover:scale-105` etc.). Use `hover:-translate-y-0.5` over 200ms ease.
- **No 3D tilt on chrome.** `TiltCard` is reserved for in-game pieces.
- **No gradients on buttons or body backgrounds.** Only game cards / Daily hero get gradients.
- **No emoji-as-icon, no AI illustrations, no mascots.**
- **No "Welcome back, [name]!" copy.** Wordmark + Daily card carry the welcome.
- **No big multi-layer drop shadows** (`shadow-xl shadow-primary/5`, `shadow-2xl`). Use `shadow-(--card-shadow-long)`.
- **No `opacity-40 grayscale` for locked/disabled states.** Use outline vs filled (see `RaritySigil`), or dim text via `text-muted-foreground`.
- **No new fonts.** Rubik (display) + Geist (sans). That's it.
- **No unifying the four game palettes.** Each game's distinct color identity is the point.
- **No `<Link>` from `@tanstack/react-router` inside `packages/ui/`.** UI package must stay router-agnostic. Use plain `<a href="/">` if needed; consumers can pass Link children.

## Pattern Hierarchy

Where each visual layer is allowed:

| Surface | Body grain | `--game-gradient` | `GamePattern` watermark | `GameGlyph` |
|---------|-----------:|------------------:|------------------------:|------------:|
| Body background | YES (subtle) | — | — | — |
| Home `MechanicCard` | inherits | YES | YES (`/[0.025]` light, `/[0.035]` dark) | YES |
| Daily hero card | inherits | YES | YES | YES |
| Game-page header | inherits | — | — | YES (size-5) |
| **Playfield card** | inherits | YES (atmospheric) | **NO** | — |
| Sidebar/controls | inherits | — | — | — |
| Hints card | inherits | — | — | — |
| Profile identity card | inherits | — | — | — |
| Profile per-game cards | inherits | YES | YES | YES |
| Achievement cards | inherits | — | — | — (uses `RaritySigil` instead) |

## Workspace / Build Gotchas

- **Tailwind v4 must scan `packages/ui/`**: [`apps/web/src/styles.css`](../apps/web/src/styles.css) has `@source "../../../packages/ui/src/**/*.{ts,tsx}"`. Any utility classes used inside the UI package are otherwise dropped silently — symptom is unstyled / hugely oversized elements at runtime, with the class present in the DOM but no matching CSS rule.
- **Local D1 migrations are Drizzle directories**, not flat `.sql` files. Wrangler's `d1 migrations apply` does not find them. Use [`infra/scripts/ensureLocalD1.ts`](../infra/scripts/ensureLocalD1.ts) to apply schema to the local miniflare D1.
- **`<GameChrome>` uses `<a href="/">`**, not TanStack `<Link>`, because `packages/ui/` doesn't depend on `@tanstack/react-router`. SPA navigation still works through TanStack's anchor interception.

## Tone in Copy

- Names of game elements stay in-context ("Numbers", "Hints", "Race Line"), not generic ("Controls", "Tips").
- Eyebrow labels (uppercase tracked text) for category/section markers. Title case for titles. No ALL-CAPS headlines.
- Subtitle meta uses `·` middle-dot separators: `Sequence Race · Hard · 2026-05-17`.
- Numbers in subtitle meta should be `tabular-nums` so they don't jitter on update.

## Verification Checklist When Adding a Game

- [ ] Game card renders on home with correct glyph + tint
- [ ] Daily challenge can pick this game and render correct hero treatment
- [ ] `/games/<id>` route uses `<GameChrome>` and `theme-<id>` class
- [ ] Playfield card uses `game-card-bg` (no `GamePattern`)
- [ ] Sidebar uses `card-shadow-long` shadow
- [ ] Confetti palette harmonizes with the theme hue
- [ ] Light + dark mode both checked
- [ ] No raw Tailwind state colors (`green-500`, `red-500`, etc.) introduced
- [ ] Achievements page sorts and renders rarity sigils correctly if game-scoped achievements added

## When You Disagree

If the design system feels wrong for a specific case, **discuss the principle with the user before deviating**. The four-phase sweep that built this language took deliberate iteration and explicit feedback rounds. Adding a one-off exception usually means another agent will add another, and the visual coherence erodes within a few sessions.
