# Design System — Strict Enforcement

This document is **load-bearing**. Future agents adding new games or UI must follow it. The visual language was carefully built across four phases of work in May 2026; deviations compound into "AI-generated dashboard" smell that took deliberate effort to avoid.

## Aesthetic Direction

**Editorial / handcrafted, with indie-game (Mini Metro, Monument Valley) restraint.** Bold geometric primitives used confidently and sparingly. Per-game color identity carried by tinted gradient + custom glyph, not by chrome decoration. Generous negative space. Tasteful typography.

## Foundation Components (`packages/ui/`)

Use these. Do not roll your own equivalents.

| Component                                             | Purpose                                                                                                                                                       | Source                                                                    |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `<Wordmark label compact? />`                         | "Math Games" + connected-dots glyph. `compact` for breadcrumbs.                                                                                               | [packages/ui/src/wordmark.tsx](../packages/ui/src/wordmark.tsx)           |
| `<GameGlyph game />`                                  | Per-game custom SVG. 4 hand-drawn primitives (constellation / podium / split-triangle / dotted-gap).                                                          | [packages/ui/src/game-glyph.tsx](../packages/ui/src/game-glyph.tsx)       |
| `<MechanicCard game tone? showGlyph? showPattern? />` | Themed card with `--game-gradient` bg, optional `GamePattern` watermark, anchored `GameGlyph`. **Decorative chrome only — never wrap a playfield in this.**   | [packages/ui/src/mechanic-card.tsx](../packages/ui/src/mechanic-card.tsx) |
| `<GameChrome game levelTitle meta? />`                | Sticky game-page header with wordmark/breadcrumb/glyph/title. Includes `LanguageToggle`+`ThemeToggle`. Use in every game route — do not roll your own header. | [packages/ui/src/game-chrome.tsx](../packages/ui/src/game-chrome.tsx)     |
| `<PlayerAvatar seed />`                               | Deterministic 2-shape geometric avatar from a seed string (typically `displayName`).                                                                          | [packages/ui/src/player-avatar.tsx](../packages/ui/src/player-avatar.tsx) |
| `<RaritySigil rarity locked? />`                      | Achievement icon — geometric primitive per rarity (circle/square/triangle/hexagon), filled vs outline.                                                        | [packages/ui/src/rarity-sigil.tsx](../packages/ui/src/rarity-sigil.tsx)   |
| `<GamePattern pattern />`                             | Tiled SVG pattern watermark. **For non-gameplay surfaces only.**                                                                                              | [packages/ui/src/game-pattern.tsx](../packages/ui/src/game-pattern.tsx)   |

## Design Tokens (`apps/web/src/styles.css`)

Use these instead of raw Tailwind colors or hard-coded values.

| Token                                                    | Use                                                                                   |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `--card-shadow-long`                                     | All elevated cards. Replaces `shadow-xl`, `shadow-lg`, multi-layer shadows.           |
| `--game-gradient`                                        | Card background tint per game. Already authored per theme.                            |
| `--game-gradient-soft`                                   | Lighter variant. Use when more than ~6 tinted surfaces would be on screen.            |
| `--success`                                              | Correct/solved state. Replaces raw `bg-green-500/X`.                                  |
| `--destructive`                                          | Wrong/error state. Already a Tailwind utility (`text-destructive`, `bg-destructive`). |
| `--chart-1/2/3`                                          | Per-game accent palette. For confetti and small UI accents.                           |
| `--rank-gold`                                            | Legendary rarity color.                                                               |
| `--line-correct` / `--line-incorrect` / `--line-pending` | In-game state colors for puzzle elements.                                             |

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
- **No glassmorphism / `backdrop-blur`** except the mobile tab bar (`tab-bar-glass`). Solid `bg-background` everywhere else.
- **No Lucide / Heroicons / icon-pack imports** for game or rank glyphs. Hand-draw SVGs. (`lucide-react` is in deps for non-glyph chrome only.)
- **No scale-up hover** on cards or chrome (`hover:scale-105` etc.). Use `hover:-translate-y-0.5` over 200ms ease.
- **No 3D tilt on chrome.** `TiltCard` is reserved for in-game pieces.
- **No gradients on buttons or body backgrounds.** Only game cards / Daily hero get gradients.
- **No emoji-as-icon, no AI illustrations, no mascots.**
- **No "Welcome back, [name]!" copy on desktop.** Mobile uses a brief greeting (`home.greeting` + `home.greetingCta`); desktop relies on Wordmark + Daily card.
- **No big multi-layer drop shadows** (`shadow-xl shadow-primary/5`, `shadow-2xl`). Use `shadow-(--card-shadow-long)`.
- **No `opacity-40 grayscale` for locked/disabled states.** Use outline vs filled (see `RaritySigil`), or dim text via `text-muted-foreground`.
- **No new fonts.** Rubik (display) + Geist (sans). That's it.
- **No unifying the four game palettes.** Each game's distinct color identity is the point.
- **No `<Link>` from `@tanstack/react-router` inside `packages/ui/`.** UI package must stay router-agnostic. Use plain `<a href="/">` if needed; consumers can pass Link children.

## Pattern Hierarchy

Where each visual layer is allowed:

| Surface                |   Body grain | `--game-gradient` |                 `GamePattern` watermark |                    `GameGlyph` |
| ---------------------- | -----------: | ----------------: | --------------------------------------: | -----------------------------: |
| Body background        | YES (subtle) |                 — |                                       — |                              — |
| Home `MechanicCard`    |     inherits |               YES | YES (`/[0.025]` light, `/[0.035]` dark) |                            YES |
| Daily hero card        |     inherits |               YES |                                     YES |                            YES |
| Game-page header       |     inherits |                 — |                                       — |                   YES (size-5) |
| **Playfield card**     |     inherits | YES (atmospheric) |                                  **NO** |                              — |
| Sidebar/controls       |     inherits |                 — |                                       — |                              — |
| Hints card             |     inherits |                 — |                                       — |                              — |
| Profile identity card  |     inherits |                 — |                                       — |                              — |
| Profile per-game cards |     inherits |               YES |                                     YES |                            YES |
| Achievement cards      |     inherits |                 — |                                       — | — (uses `RaritySigil` instead) |

## Mobile-First Layout (`packages/ui/`)

The app targets Vietnamese kids on phones/tablets. Mobile is the primary layout; desktop is a reference fallback.

### Layout Architecture

Each route renders **two layout blocks** — desktop first in the DOM (for E2E locator ordering), mobile second:

```tsx
<div>
  {/* Desktop — hidden below md (768px) */}
  <div className="hidden md:flex ...">...</div>

  {/* Mobile — hidden at md and above */}
  <div className="md:hidden ...">...</div>
</div>
```

Both exist in the DOM simultaneously; CSS breakpoints toggle visibility. Tests use `mobileLayout()` / `desktopLayout()` helpers to scope Playwright locators to the correct block.

### Mobile Components

| Component                                          | Purpose                                                                       | Source                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `<MobileTabBar active onNavigate />`               | Bottom nav with 3 tabs (Home / Daily / Profile). Glass backdrop, `md:hidden`. | [packages/ui/src/mobile-tab-bar.tsx](../packages/ui/src/mobile-tab-bar.tsx)       |
| `<MobileAppHeader playerName? subtitle? right? />` | Compact top header with Wordmark + avatar.                                    | [packages/ui/src/mobile-app-header.tsx](../packages/ui/src/mobile-app-header.tsx) |

### Mobile Design Patterns

- **Touch targets**: 44px minimum height on all interactive elements (buttons, cards, tab bar items).
- **Bottom tab bar**: Sticky bottom nav with `tab-bar-glass` backdrop blur. 3 tabs — icons from SVG, labels from i18n keys `nav.home`, `nav.daily`, `nav.profile`.
- **Eyebrow labels**: `.eyebrow` class — `0.68rem`, `font-weight: 600`, `letter-spacing: 0.14em`, uppercase, `text-muted-foreground`. Used for category markers, stat labels, dates.
- **Daily hero card**: Oversized `GameGlyph` (size-56) anchored bottom-right, gradient background at 95% opacity, streak counter, "Start →" CTA.
- **Game index cards**: Each card shows `№ {index}`, game tag (via `formatGameTag()`), game title, progress bar, and "Continue →" / "Play →" CTA.
- **Stats strip**: 3-column grid with `1px solid var(--border)` dividers. Each cell: eyebrow label, tabular-nums value, subtitle.
- **Profile identity**: 88px `PlayerAvatar`, rank title, 2×2 stats grid, per-game progress cards with `GameGlyph`, 3-wide achievement grid with `RaritySigil`.

### Responsive Breakpoints

| Viewport                 | Layout                               | Header                        | Navigation              |
| ------------------------ | ------------------------------------ | ----------------------------- | ----------------------- |
| < 768px (phone)          | Single column, stacked cards         | `MobileAppHeader`             | `MobileTabBar` (bottom) |
| ≥ 768px (tablet/desktop) | Max-width container, 2-col game grid | `Wordmark` + avatar + toggles | Inline links            |

## Internationalization (`packages/core/src/i18n/`)

The app is Vietnamese-first. All UI text goes through the `useT()` hook.

### Adding New Translation Keys

1. Add the key to **both** `en` and `vi` objects in [`packages/core/src/i18n/core.ts`](../packages/core/src/i18n/core.ts).
2. Per-game translations go in `packages/game-{name}/src/translations.ts`.
3. Format helpers in [`apps/web/src/i18n-format.ts`](../apps/web/src/i18n-format.ts): `formatGameTitle()`, `formatGameTag()`, `formatDifficulty()`, `formatLevelName()`, `formatAchievementName()`, `formatRankName()`.
4. In components, use `const t = useT()` then `t('key.name')`.

### Key Conventions

- Navigation: `nav.home`, `nav.daily`, `nav.profile`
- Home page: `home.greeting`, `home.todayChallenge`, `home.streak`, `home.start`, `home.continue`
- Game tags: `gameTag.magicGraph`, `gameTag.sequenceRace`, etc. (short category labels like "Logic · Graph")
- Stats: `stats.completed`, `stats.achievements`, `stats.progress`

## Adding a New Game — Complete Recipe

1. **Create package**: `packages/game-{name}/` with `module.ts`, `translations.ts`, `schema.ts`, `catalog.ts`, `logic.ts`.
2. **Register**: Add to `apps/web/src/games/registry.ts` and `apps/web/src/i18n-translations.ts`.
3. **Game glyph**: Add SVG to `GameGlyphId` union in `packages/ui/src/game-glyph.tsx`. 3–5 primitives, `currentColor`, hand-drawn feel.
4. **Theme**: Add `.theme-{name}` + `.dark .theme-{name}` blocks in `apps/web/src/styles.css`. Needs: `--primary`, `--primary-foreground`, `--accent`, `--ring`, `--glow`, `--chart-1/2/3`, `--game-gradient`, `--game-gradient-soft`.
5. **Pattern**: Add pattern mapping in `MechanicCard` and `GamePattern`.
6. **Route**: Create `apps/web/src/routes/games/{name}.tsx`. Use `<GameChrome>`, apply `theme-{name}` to `<main>`.
7. **Home card**: Appears automatically via `registry` — `formatGameTitle()` and `formatGameTag()` need translations.
8. **i18n**: Add `gameTitle.{camelName}`, `gameTag.{camelName}`, `gameDescription.{camelName}` to both locales.
9. **Achievements**: Add to game module's `achievements` array + translation keys.
10. **Smoke test**: Add route to `requiredRoutes` in `infra/scripts/smokeRemoteWorker.ts` and `blockedRoutes` for old root paths.
11. **Verify**: Run `pnpm check` (format + typecheck + lint + test + build). Check the verification checklist below.

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
