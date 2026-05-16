## 2026-05-16 - Turborepo Monorepo Conversion + Effect Maximization
**Status**: active
**Branch**: main (191 uncommitted files — full monorepo restructure)
**Next**: Services domain split → `packages/effect-infra`, `packages/effect-game`, `packages/effect-classroom`

### Done This Session
- [x] Converted single-package math-games into Turborepo monorepo (8 packages + 1 app)
- [x] Created 3 built packages (tsup → ESM + DTS): `@math-games/core`, `@math-games/db`, `@math-games/services`
- [x] Created 4 source game packages: `@math-games/game-{magic-graph,sequence-race,shape-architect,pattern-detective}`
- [x] Created `@math-games/ui` source package (React components)
- [x] Moved infra (alchemy.run.ts + scripts) to `infra/` workspace package
- [x] `turbo build` — 4/4 tasks passing
- [x] `typecheck` — 0 errors (fixed drizzle-orm duplication via re-exports from @math-games/db)
- [x] 534 unit tests pass across all packages (vitest workspace mode)
- [x] Dev server starts (Vite resolves all 2283 modules from workspace packages)
- [x] Broke UI ↔ game cycle: translations now injected via React context from apps/web
- [x] Removed old `src/` directory from root

### In Progress
- [ ] Services domain split: split 24 services into 3 domain packages
  - `packages/effect-infra` — WorkerEnv, Header, Clock, Random, KvCache, OriginGuard, RateLimit, Turnstile
  - `packages/effect-game` — Db, PlayerIdentity, GameAttempts, Leaderboard, Rank, DailyStreak, Analytics
  - `packages/effect-classroom` — Classroom, Assignment, AccountLink, AnalyticsDashboard
  - Each exports a domain Layer; app composes: `InfraLayer → GameLayer → ClassroomLayer`

### Blockers/Issues
- [ ] `recommendations.ts` in `apps/web/src/games/progress/` is a stub — restore from git
- [ ] `pnpm install` hits iconv-lite `.idea` permission issue — run `chmod -R u+w node_modules/.pnpm/iconv-lite@0.6.3 && rm -rf node_modules/.pnpm/iconv-lite@0.6.3/node_modules/iconv-lite/.idea` before install
- [ ] E2E tests (Playwright) not yet updated for new paths
- [ ] `turbo test` in parallel hits `/tmp` sandbox restriction (tests pass individually via `pnpm --filter`)

### Context to Remember
- **Hybrid build model**: core/db/services built with tsup (ESM + DTS externalized); games/ui are source packages Vite resolves directly
- **`createServerFn` constraint**: must be in Vite-processed files — all `*.functions.ts` stay in `apps/web`
- **Types resolution**: built packages use `"types": "./src/index.ts"` (source) to avoid drizzle-orm type duplication
- **drizzle-orm dedup**: `@math-games/db` re-exports `eq`, `sql`, `and`, etc. — apps/web imports operators from db, not drizzle-orm directly
- **Effect already mature**: ManagedRuntime, Match.exhaustive, Layer composition, Schema, retry+Schedule. `@effect/platform` is still `unstable/` in Effect 4.0 beta — skip for now
- **Translations architecture**: `LocaleProvider` accepts `translations: TranslationDict` prop. Format functions live in `apps/web/src/i18n-format.ts`
- **Dependency graph (no cycles)**: `core → db → services → app`; games → core only; UI → core only

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
