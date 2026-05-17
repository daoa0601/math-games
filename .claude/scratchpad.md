## 2026-05-17 - Visual Sweep (Phases A–D) + Design System Enforcement
**Status**: done (visual work); uncommitted on `main`
**Branch**: main
**Next**: User decides whether to commit. Then Phase D-leftovers (unified level selectors, theme-derived confetti at runtime) if desired.

### Done This Session — Four-Phase Visual Sweep

**Phase A — Visual vocabulary + home page**
- New UI components: `Wordmark`, `GameGlyph` (4 hand-drawn SVGs), `MechanicCard` (themed card w/ pattern + glyph), `PlayerAvatar` (deterministic geometric)
- `apps/web/src/styles.css`: added `--card-shadow-long`, `--game-gradient-soft` (per game), `body` SVG-noise grain (light + dark)
- Rebuilt `apps/web/src/routes/index.tsx` around the new vocabulary

**Phase B — Daily / Profile / Achievements**
- New: `RaritySigil` (circle/square/triangle/hexagon per common/rare/epic/legendary, filled vs outline)
- Added `compact` prop to `Wordmark` for breadcrumb headers
- Rebuilt `routes/daily.tsx` (hero `MechanicCard`), `routes/profile.tsx` (PlayerAvatar identity card + 4 game `MechanicCard` grid, all existing functionality preserved), `routes/achievements.tsx` (sigil grid, sorted unlocked-first then by rarity)

**Phase C — All 4 game pages**
- New: `GameChrome` (sticky header w/ wordmark + breadcrumb + game glyph + level title + meta slot)
- Applied to magic-graph, sequence-race, shape-architect, pattern-detective
- Removed duplicated header markup in each (~20 LOC per route)
- Standardized card shells: playfield `game-card-bg border-0`, sidebar `border border-border/60 shadow-(--card-shadow-long)`, hints `border border-primary/15 bg-primary/[0.04] shadow-none`
- Dropped `backdrop-blur` from all headers (no glassmorphism)

**Phase D — In-game polish**
- Fixed `sequence-race` confetti palette from orange to brick reds (matches brick theme; was wrong since redesign)
- Added themed confetti to `pattern-detective` on correct answer
- Rebuilt `pattern-detective` `ResultCard`: theme tokens (`--success`, `--destructive`) instead of raw `green-500/X`, `card-shadow-long`, `animate-scale-in`, display font heading, tabular answer
- Polished `magic-graph` + `shape-architect` error modals: `bg-foreground/30` overlay (was `bg-black/40`), proper `role="dialog"`/`aria-modal`, `animate-scale-in`, destructive border, display font heading

**Design system enforcement docs**
- New: `docs/design-system.md` — full reference for future agents: foundation components, design tokens, DO/DO-NOT list with reasons, pattern hierarchy table, build gotchas, verification checklist
- `AGENTS.md` updated with a "Read Before Touching UI" section that points to it

### Major Side-Fixes (Discovered + Fixed)
- **Local D1 was empty** (no tables) → home page loader was throwing "Unable to load your profile" / "today's challenge". Drizzle migrations are subdirectories not flat .sql files, so `wrangler d1 migrations apply` reports "No migrations to apply" while never seeing them. Fix: ran `infra/scripts/ensureLocalD1.ts` via `tsx` (requires `dangerouslyDisableSandbox: true` so wrangler can write to `~/Library/Preferences/.wrangler/logs/`).
- **Tailwind v4 wasn't scanning `packages/ui/`** → utility classes used in `MechanicCard` (`size-12`, `top-5`, `pr-12`) generated no CSS at runtime; glyphs rendered at 400px+ filling their cards. Fix: added `@source "../../../packages/ui/src/**/*.{ts,tsx}"` to `apps/web/src/styles.css`. **Required for any new component added under `packages/ui/`.**
- Removed `<GamePattern>` from in-game playfield cards (magic-graph/sequence-race/shape-architect) per user feedback that the pattern competed with the puzzle's geometry.

### Files Changed (UI)
- `packages/ui/src/`: new `game-glyph.tsx`, `wordmark.tsx`, `mechanic-card.tsx`, `player-avatar.tsx`, `rarity-sigil.tsx`, `game-chrome.tsx`; updated `index.ts`
- `apps/web/src/styles.css` — tokens + `@source` directive + body grain
- `apps/web/src/routes/`: `index.tsx`, `daily.tsx`, `profile.tsx`, `achievements.tsx`, `games/magic-graph.tsx`, `games/sequence-race.tsx`, `games/shape-architect.tsx`, `games/pattern-detective.tsx`
- `docs/design-system.md` (new) + `AGENTS.md` updated

### Verification
- `pnpm --filter web typecheck` — PASS (clean)
- `pnpm --filter web lint` — PASS (clean)
- `pnpm --filter ui typecheck` — PASS (clean)
- Production build — PASS
- Browser visual: home, daily, profile, achievements, all 4 game routes verified in light + dark; pattern-detective wrong-answer ResultCard verified

### Context to Remember
- **Aesthetic direction**: editorial / handcrafted, indie-game (Mini Metro, Monument Valley) restraint. Bold geometric primitives, generous negative space, per-game color identity via gradient + custom glyph, NOT via chrome decoration.
- **Pattern hierarchy rule**: `GamePattern` is decorative chrome only — never on the playfield where the puzzle lives. User flagged this explicitly when they saw constellation pattern overlaying the magic-graph triangle. Documented in `docs/design-system.md`.
- **Per-game palette identity is the point.** Magic Graph=deep purple (290), Sequence Race=brick (25), Shape Architect=teal (170), Pattern Detective=amber (70). Don't unify.
- **Body grain alpha was tuned twice.** First pass (0.55 light / 0.4 dark) was sandpaper-loud. Final values: 0.16 light / 0.13 dark.
- **`MechanicCard` watermark opacity was tuned twice** too: ended at `text-primary/[0.025]` light, `/[0.035]` dark. Higher values made the pattern compete with content in dark mode (high-lightness primary).
- **`packages/ui/` must not depend on `@tanstack/react-router`** — `GameChrome` uses plain `<a href="/">` instead of `<Link to="/">` so the package stays router-agnostic.
- **Translations**: `t('app.title')` is "Math Games" / "Trò Chơi Toán". Game titles via `formatGameTitle(locale, gameId)`. Don't hard-code Vietnamese.
- **Sandbox quirk**: `wrangler` writes logs to `~/Library/Preferences/.wrangler/logs/` which is outside the sandbox allowlist. Any wrangler command needs `dangerouslyDisableSandbox: true`.

### What I Deliberately Did NOT Do (Open Scope)
- **Unified level selectors across games.** Each game has different metadata; building a single `<LevelGrid>` of `MechanicCard` micro-tiles needs per-game glue. Worth scoping deliberately.
- **Runtime theme-derived confetti.** Currently each game passes a hex palette that mirrors its theme — works but is parallel state. A `<Confetti gameId={...} />` API that reads `--chart-1/2/3` from the theme via getComputedStyle would be cleaner. Browser canvas oklch support varies, so deferred.
- **i18n for "Next Level" / "The answer is X" in pattern-detective ResultCard.** Hardcoded English remained from prior code.
- **Next/prev level navigation.** Not added.

---


**Status**: active
**Branch**: main (uncommitted — full monorepo restructure + domain split)
**Next**: Commit all changes

### Done This Session
- [x] Converted single-package math-games into Turborepo monorepo (8 packages + 1 app)
- [x] Created 3 built packages (tsup → ESM + DTS): `@math-games/core`, `@math-games/db`, `@math-games/services`
- [x] Created 4 source game packages: `@math-games/game-{magic-graph,sequence-race,shape-architect,pattern-detective}`
- [x] Created `@math-games/ui` source package (React components)
- [x] Moved infra (alchemy.run.ts + scripts) to `infra/` workspace package
- [x] `turbo build` — 7/7 tasks passing
- [x] `typecheck` — 0 errors across all domain packages + services barrel
- [x] 534 unit tests pass across all packages (vitest, run individually via --filter)
- [x] Dev server starts (Vite resolves all 2283 modules from workspace packages)
- [x] Broke UI ↔ game cycle: translations now injected via React context from apps/web
- [x] Removed old `src/` directory from root
- [x] **Services domain split complete**: split 24 services into 3 domain packages
  - `packages/effect-infra` — WorkerEnv, Header, Clock, Random, KvCache, OriginGuard, RateLimit, Turnstile, errors, retry
  - `packages/effect-game` — Db, PlayerIdentity, GameAttempts, Leaderboard, Rank, DailyStreak, Analytics
  - `packages/effect-classroom` — Classroom, Assignment, AccountLink, AnalyticsDashboard
  - Each exports a domain Layer; app composes `InfraLayer → GameLayer → ClassroomLayer`
- [x] **Removed `@math-games/services` barrel** — apps/web imports directly from domain packages
  - Moved `app-layer.ts` + `run-server-effect.ts` to `apps/web/src/services/`
  - All 16 import sites updated to use `@math-games/effect-{infra,game,classroom}` directly
- [x] Implemented `recommendations.ts` (was stub) — suggests next levels per game based on completion progress
- [x] Fixed `@math-games/ui` typecheck: added `ImportMeta.env` declaration for Vite env vars
- [x] Restored E2E tests (lost during monorepo conversion) to `apps/web/tests/e2e/`
- [x] Fixed playwright config: updated `ensureLocalD1.ts` path for monorepo layout

### Verification
- **`turbo build typecheck test lint` — 32/32 tasks pass**
- `turbo typecheck` — 16 packages clean
- `turbo build` — 6 packages (3 domain + core + db + web)
- `turbo test` — 14 packages, 655 tests in parallel
- `turbo lint` — 6 packages, eslint 9 flat config at root + web-specific overrides

### Blockers/Issues
- [ ] `pnpm install` hits iconv-lite `.idea` permission issue — workaround: `rm -rf node_modules && pnpm install --no-frozen-lockfile`

### Context to Remember
- **Hybrid build model**: core/db/services built with tsup (ESM + DTS externalized); games/ui are source packages Vite resolves directly
- **`createServerFn` constraint**: must be in Vite-processed files — all `*.functions.ts` stay in `apps/web`
- **Types resolution**: built packages use `"types": "./src/index.ts"` (source) to avoid drizzle-orm type duplication
- **drizzle-orm dedup**: `@math-games/db` re-exports `eq`, `sql`, `and`, etc. — apps/web imports operators from db, not drizzle-orm directly
- **Effect already mature**: ManagedRuntime, Match.exhaustive, Layer composition, Schema, retry+Schedule. `@effect/platform` is still `unstable/` in Effect 4.0 beta — skip for now
- **Translations architecture**: `LocaleProvider` accepts `translations: TranslationDict` prop. Format functions live in `apps/web/src/i18n-format.ts`
- **Dependency graph (no cycles)**: `core → db → effect-infra → effect-game → effect-classroom → app`; games → core only; UI → core only

### Monorepo Structure
```
math-games/
├── apps/web/           — TanStack Start (routes, server functions, registry)
├── packages/core/      — BUILT: GameModule interface, schemas, errors, ranks, i18n, seeded random
├── packages/db/        — BUILT: Drizzle schema, createDb, drizzle operators re-export
├── packages/services/  — BUILT: 24 Effect services, AppLayer, ManagedRuntime
├── packages/ui/        — SOURCE: React components, locale context, hooks
├── packages/game-*/    — SOURCE: 4 game packages (logic, catalog, module, tests)
├── infra/              — Alchemy IaC + deployment scripts
├── turbo.json          — build → typecheck → test pipeline
└── pnpm-workspace.yaml
```

---

## 2026-05-16 - Math Games Full Implementation Complete
**Status**: done
**Branch**: main (math-games/)
**Next**: Commit all changes, then Phase 4 (curriculum games: Fraction Builder, Equation Balance, etc.)

### Completed — All Phases P0 through 3.5
- **P0–P3**: Registry-derived GameId, per-module translations, achievement co-location, scaffolding script
- **Phase 1**: Daily streaks, post-attempt feedback, rank-up toasts, resume/recommendations, translation completeness test
- **Phase 2**: Pattern Detective (4th game) — 18 levels, full module, route, 12 tests
- **Phase 3.1**: Game attempts (append-only history)
- **Phase 3.2**: Classroom system (3 tables, 2 services, 6 server functions, /classroom route)
- **Phase 3.3**: Account linking (magic link tokens, request/verify flow)
- **Phase 3.4**: Scoped leaderboards (personal + classroom scope, pipeline hook)
- **Phase 3.5**: Analytics dashboard (completion rates, level difficulty, retention — /admin/analytics route)

### New Services (8 total added)
1. DailyStreakService — daily challenge streaks
2. GameAttemptsService — append-only attempt history
3. ClassroomService — classroom CRUD + membership
4. AssignmentService — teacher assignments
5. AccountLinkService — magic link account linking
6. LeaderboardService — scoped leaderboard entries
7. AnalyticsDashboardService — aggregated analytics from game_attempts

### New Tables (7 total added)
1. daily_player_results
2. game_attempts
3. classrooms
4. classroom_members
5. assignments
6. account_links
7. leaderboard_entries

### Layer Architecture (final)
```
InfraLayer: WorkerEnv, Clock, Random, Headers
CacheLayer: KvCache (depends on Infra)
DataLayer: Db, PlayerIdentity (depends on Infra + Cache)
ServiceLayer: RateLimit, OriginGuard, Analytics, Turnstile,
              DailyStreak, GameAttempts, Classroom, Assignment,
              AccountLink, Leaderboard, AnalyticsDashboard
              (depends on Infra + Cache + Data)
AppLayer: mergeAll(Service, Data, Cache, Infra)
```

### Verification
- pnpm typecheck: PASS
- pnpm lint: PASS
- pnpm test: 717 tests pass (28 test files)
- 3 Drizzle migrations generated
