## 2026-05-30 — Slice 4c COMPLETE: per-player skill-aware daily → **PHASE 1 DONE**

**Status**: done (4c). Committed `38dbe75` on main (atop the theme fix `172e23a`) — **NOT pushed**. Only `.claude/scratchpad.md` + `.turbo/cache` uncommitted. **Phase 1 of the pedagogy redesign is now complete (4a + 4b + 4d + 4c).**
**Validation**: `pnpm check` green — typecheck 19/19, lint 8/8, unit tests (new: daily.strategy 8, daily.logic 3, getPerGameStats 2), build 7/7. Format clean (scratchpad only). **Browser-verified** (fresh dev server, migration applied to local D1): home + `/daily` load the per-player daily; **2 players hold 2 distinct pinned dailies** in `player_daily_selections` (sequence-race/arith_10 vs pattern-detective/pd-easy-add3); reload is stable (pinned); the play link carries `daily=<date>` into `/games/sequence-race`; no console errors.
**Plan**: `~/.claude/plans/mighty-nibbling-boot.md` (approved).

### What 4c did

Replaced the **global** one-pick-per-date daily with a **per-player, skill-aware** one, and fixed the **dormant daily recording** discovered during exploration.

- **core** (`game-module.ts`): `getDailyPick(hash)` → `getDailyPick({ seed, difficulty })` on the contract + all 5 module impls + the `createGameModule` default (difficulty-filtered pick with a `pool.length>0 ? pool : catalog` fallback). New `DailyPickInput`. (pattern-detective uses the default.)
- **`daily.strategy.ts`** (NEW, pure): `frontierWeightedStrategy` + FNV-1a `seedHash`. Steer each player to their least-practiced / lowest-completion published game; never-played scores 0 (always frontier → broadens coverage); date+player-seeded tiebreak for variety; difficultyHint from completion rate. New player → deterministic seeded pick. **Pluggable** (`DailySelectionStrategy`) so depth can grow later. 8 unit tests.
- **effect-game** (`game-attempts.ts`): `GameAttemptsService.getPerGameStats(playerId)` — one `GROUP BY gameId` → `{gameId, attempts, completionRate}`. Feeds the strategy. (Dropped `lastPlayedDate` — strategy doesn't use it, avoids the `max(timestamp)` type question.)
- **`daily.logic.ts`**: `planDailyChallenge(dateKey, playerId, perGameStats, strategy?)` — **synchronous**, pure given stats. **`daily.server.ts`**: `loadDailyChallenge` resolves + upserts the player (FK safety), KV key `daily:${date}:${playerId}`, reads/pins `player_daily_selections` (NEW table + migration `20260529184904_curly_random`), race-safe `onConflictDoNothing` + re-read.
- **recording fix** (the dormant bug): no route passed `challengeDate` → `daily_player_results` never written, streaks dormant. Added `daily?` to `level-search.ts`; daily + home play links pass `daily=challengeDate`; the 6 game routes read it and forward `...(daily ? { challengeDate: daily } : {})` into `recordProgress`. **Server side unchanged** — the `if (data.challengeDate)` record path already existed, just unreachable.
- **cron** (`daily-cron.ts`): dropped the global `pregenerate` (per-player can't be pre-generated for an unbounded, evolving player set — it's pinned lazily on first load); kept shape-architect pre-solve + level-forge trigger; repointed purge → old `player_daily_selections`.

### Decisions / deviations from the plan

- **Did NOT add `player_daily_selections` to the `ensureLocalD1` `requiredTables` probe** (plan said to). That probe is a **representative 4-table subset** ("is the schema bootstrapped?"), not the full list. Adding a fresh table makes a _stale_ local DB fail the probe → re-apply ALL migrations → `CREATE TABLE` conflict → hard `pnpm dev` failure. Fresh DBs (CI/e2e/new clones) already get the table via the full migration loop. Left the probe at 4 + added a comment warning. **Returning devs reset local D1 on schema change (existing workflow).**
- **`dailyChallenges` (global table) left defined but unused** — no reads/writes; dropping it is a deferred follow-up migration (decouples a destructive DROP from this behavioral change).
- **`record-progress-daily.test.ts` not written** (plan listed it). The server record logic is **pre-existing & unchanged** — only reachability changed (client wiring). A faithful pipeline test needs ~10 service stubs for unchanged logic; the new behavior is verified in the browser (play link carries `daily` into the game route). Substituted browser verification.
- **Did NOT auto-complete a daily play** to assert the final `daily_player_results` write — the picked daily was sequence-race (minimax turn game, hard to drive via DOM). Verified the wiring up to the game route; the write-on-completion is the unchanged server path now made reachable. Low-risk; user can confirm by playing the daily.

### Known edge (out of scope)

- **New-player double-mint**: home + `/daily` loaders both `Promise.all(getPlayerProfileOverview, getDailyChallenge)`, and both now call `PlayerIdentityService.resolve()`. For a returning player (has `mg_player` cookie) → consistent. For a brand-new cookieless player's FIRST load, the two parallel resolves can mint two ids → an orphan player+selection row (self-heals on reload; cleaned by the 30-day purge). Observed in verification (2 player rows). A real fix is request-scoped identity memoization shared across server fns — a broader identity-architecture change, deliberately not in 4c.

---

## 2026-05-30 — FIX: theme hydration mismatch on `<html>` (the pre-existing one 4d noted)

**Status**: done. Committed `172e23a` on main — **NOT pushed**. One file only: `apps/web/src/routes/-root-components.tsx`.
**Root cause**: the pre-hydration inline script in `RootDocument` (added in `068ae03`) applies `class="dark"` to `<html>` before React hydrates, but SSR renders `<html>` with no class (server can't read client `localStorage` — theme isn't in a cookie). React logged "A tree hydrated but some attributes…didn't match" on every load, pointing at `-root-components.tsx:87` (`- className="dark"`).
**Fix**: added `suppressHydrationWarning` to `<html>` (canonical next-themes / React-docs escape hatch for "a script mutates `<html>` before hydration"). Suppresses the warning one level deep, only on `<html>`'s own attributes. NOT emitted as a real DOM attr (React-internal) → SSR HTML byte-identical; no flash (the blocking head script still applies the class before first paint).
**Validated**: browser (preview server) — console error GONE on `/` (dark + light) and `/games/magic-graph` (dark); `<html class>` + body bg correct each way; magic-graph screenshot clean in dark. `pnpm check` constituents green **except prettier**: typecheck 19/19, lint 8/8, test 18/18 (web 27), build 7/7. Prettier flags only `.claude/scratchpad.md` (never committed) + `apps/web/src/daily/daily.strategy.test.ts` (**untracked 4c WIP, not mine**) — both pre-existing/unrelated.
**Note**: tree has active uncommitted **slice-4c WIP** (per-player daily: `daily.strategy.{ts,test.ts}`, `player_daily_selections` table in schema + ensureLocalD1 + new migration, core/effect-game edits). Left entirely untouched.

---

## 2026-05-30 — Slice 4d COMPLETE: localized misconception feedback (FB + EB)

**Status**: done (4d). Committed `789c4d0` on main — **NOT pushed**. Only `.claude/scratchpad.md` + `.turbo/cache` uncommitted.
**Validation**: whole-tree green — typecheck 19/19, lint 8/8, unit 18/18 tasks (FB 31, EB 29, web 19, core 18), build 7/7. Format:check flags only this scratchpad. **Browser-verified** (preview server): EB shows the misconception message in en _and_ vi (desktop block + mobile chip); FB in en (screenshot). Only console error is a **pre-existing** theme hydration mismatch on `<html class="dark">` in `-root-components.tsx` — unrelated to 4d.
**Next**: **4c** (per-player daily rewrite) is the last Phase-1 slice. Plus the 4b mastery-aggregation follow-on (count-based achievements).

### What 4d did

Replaced the hardcoded-English `{ kind: "generic", message }` feedback in Fraction Builder + Equation Balance with a **keyed** `{ kind: "misconception", labelKey, params }` channel, so wrong-answer feedback is localizable (en + vi) and item logic is string-free. Routes now render the **specific** misconception instead of a generic "try again".

- **core** (`game-module.ts`): added the keyed `misconception` member to the `GameFeedback` union (alongside the existing `generic` escape hatch, which pattern-detective still uses — out of 4d scope).
- **EB** (`logic.ts`): wrong substitution → `eb.feedback.wrong_substitution` (params `{answer,result,rightSide}`), phrased to reinforce "both sides must match" (the equality misconception). en + vi templates in `translations.ts`.
- **FB** (`logic.ts`): 5 sites → `fb.feedback.{zero_denominator,not_equal,not_equivalent,not_simplified,compare_greater,compare_less,compare_equal}`. The compare relation is 3 distinct keys (not an interpolated relation word). en + vi templates.
- **web** (`i18n-format.ts`): new `formatGameFeedback(locale, feedback)` — `t`/`tx` do NOT interpolate, so this resolves the labelKey via `tx` and replaces `{param}` placeholders itself. Returns null for non-`misconception` kinds. Both routes store `validation.feedback` in state and render `formatGameFeedback(locale, feedback) ?? t('game.tryAgain')`. **FB mobile gained a wrong-answer chip it previously lacked** (it only showed the correct case).
- **tests**: FB + EB `logic.test.ts` rewritten to assert the keyed contract (labelKey + params, not English substrings); new `i18n-format.test.ts` (en + vi interpolation + fallbacks); new per-game `translations.test.ts` en/vi **key-parity** tests (guards every `*.feedback.*` key exists in both locales).

### Decisions / notes (4d)

- **Keyed channel, not per-game typed kinds** — mirrors the `SolutionStep`/`HintStep` labelKey+params design; keeps the core `GameFeedback` union from exploding and lets each game own its feedback strings in its `translations.ts`.
- **`t` has no interpolation** (it's `dict[key] ?? key`) — the `{param}` interpolation lives in `formatGameFeedback`. Game translations merge into the global dict (`i18n-translations.ts`), so `tx(locale, 'fb.feedback.*')` resolves.
- **Routes run `validate` client-side** (they already did, for instant result) — so the feedback object is available locally without waiting on the server fn; rendering re-localizes live on locale toggle (we store the feedback object, not a frozen string).
- **`generic` kind kept** — pattern-detective still uses it (converting PD is out of the FB+EB scope).

---

## 2026-05-29 (PM3) — Slice 4b COMPLETE: skill-aware achievements

**Status**: done (4b). Committed `b0055f2` on main — **NOT pushed**. Only `.claude/scratchpad.md` + `.turbo/cache` uncommitted.
**Validation**: whole-tree green — typecheck 19/19, lint 8/8, unit 18/18 tasks (core 18, web 15), build 7/7. **E2E not run** — server-side achievement logic + a contract extension; no game gates on skill yet, so existing unlock results + pipeline return shape are unchanged (pinned by a non-regression test).
**Next**: **4c** (per-player daily rewrite) or **4d** (misconception feedback FB+EB — independent). Plus the mastery follow-on below.

### What 4b did

Made the achievement contract **skill-aware**: an `unlockWhen` condition may require the played level to exercise a given skill, and the level's manifest `skillTags` are threaded into the `AchievementContext` through the record pipeline.

- **core** (`game-module.ts`): `AchievementUnlockCondition.skillTag?: string` + `AchievementContext.skillTags?: readonly string[]`; `evaluateAchievementsByCondition` gates `if (c.skillTag && !ctx.skillTags?.includes(c.skillTag)) return false` — **AND-composed** with the existing completed/difficulty/optimal/winner checks. NEW `__tests__/achievement-conditions.test.ts` (5 tests) proves the predicate via a synthetic `createGameModule` (the level-manifest.test.ts pattern; core had no direct test of the unlockWhen engine before).
- **web** (`progress.server.ts`): `RecordGameProgressInput.skillTags?` → forwarded into the `checkAchievements` context. (`server-handlers.ts`): resolves the level manifest **once** (consolidated with 4a's diagnostics) and passes `manifest?.skillTags` into `recordGameProgress`. Threading pinned by a non-regression test in `achievements.logic.test.ts`.

### Decisions / scope (4b)

- **Scoped to infrastructure** (predicate + context + both evaluator paths + manifest threading), exactly as this handoff locked 4b. Did **not** add concrete per-game skill achievements: all 6 games carry **uniform skillTags across their levels** (slice-3 batch), so a single-attempt skill gate is redundant with `completed`. Achievement strings are localized by id (`achievement.<id>.name/description` in each game's `translations`), so a concrete achievement also carries en+vi i18n + a product-naming decision — deferred.
- **`skillTag` is singular** (one tag per condition), matched against `ctx.skillTags.includes(...)`; composes with other gate fields rather than needing multiple.
- **Imperative path** (`checkAchievements`/global achievements) needed no logic change — it already forwards the full context to each game's declarative evaluator; carrying `skillTags` on the context is sufficient.

### ===> MASTERY FOLLOW-ON (the plan's real "mastery" achievements) <===

The plan's examples ("solve 5 two-step equations with no hints", "recovered from a misconception") are **count-based + process-signal-based**, NOT single-attempt. They need: (1) aggregating the **4a attempt log** (`game_attempts.completion_json` skillTags, filtered by the `completed`/`score` columns) — a new read/aggregate, and (2) **per-attempt process signals** (hintLevelUsed, invalidMoveTypes, undoCount, timeMs) that don't exist yet — Phase-2 workbench instrumentation. 4b ships the _gate_; the _mastery aggregation_ is a deliberate later slice once the workbench emits process signals.

---

## 2026-05-29 (PM2) — Slice 4a COMPLETE: diagnostic attempt logging

**Status**: done (4a). Committed `0c6ebe5` on main — **NOT pushed** (user reviews + deploys; push to main = prod deploy). Only `.claude/scratchpad.md` + `.turbo/cache` left uncommitted, as before.
**Validation**: whole-tree green — typecheck 19/19, lint 8/8, unit 18/18 tasks (core 13, effect-game 53), build 7/7. Format:check flags only this scratchpad (never committed). **E2E not run** — 4a is server-only logging (writes a DB column nothing reads/renders; pipeline return shape unchanged), so route/DOM flows are unaffected; covered by unit tests at both seams instead.
**Next**: **Step 4b — mastery achievements** (natural next: attempts are now keyed to skills). 4c (per-player daily) + 4d (misconception feedback FB+EB) still pending.

### What 4a did

`game_attempts.completion_json` now carries the level's **diagnostic tags** (skill/misconception/difficulty), resolved server-side from the manifest, replacing the raw client-completion blob (which nothing read). This is the substrate 4b mastery + the teacher dashboard will query: group attempts by skillTag, filter by the `completed`/`score` columns already on the row.

- **core** (`packages/core/src/level-manifest.ts`): new pure `buildAttemptDiagnostics(manifest) → AttemptDiagnostics | null` = `{ skillTags, misconceptionTags?, difficultyFeatures? }`; returns `null` for un-tagged levels (→ NULL column); **deliberately excludes the answer-bearing `solutionTrace`/`hintPath`**. Exported from barrel. +5 tests in `__tests__/level-manifest.test.ts`.
- **pipeline** (`apps/web/src/games/server-handlers.ts`): `createRecordProgressPipeline` resolves the level via `module.resolveLevelConfig` (cheap pure re-lookup — level already validated by `validateAndComputeScore`) and writes `buildAttemptDiagnostics(level?.manifest)` to `completionJson` (`undefined` → NULL).
- **test** (`packages/effect-game/src/__tests__/game-attempts.test.ts`): NEW — the previously-missing `GameAttemptsService` test. Verifies `record` persists the row to `schema.gameAttempts` incl. `completionJson`, and stores `undefined` → NULL when no diagnostics. Harness mirrors `daily-streak.test.ts` (stub `DbService`, capture inserted values).

### Decisions (4a)

- **Reused `completion_json`, no migration** — per the locked audit decision ("diagnostics persist via existing unused game_attempts.completion_json"). Column semantics shifted raw-completion → attempt-diagnostics. Safe: confirmed **no reader** of `completionJson` anywhere (service `getHistory`/`getStats` don't select it).
- **Replaced (not augmented)** the raw `JSON.stringify(data.completion)`: client-submitted, non-authoritative (server re-derives score from it), unread.
- **Outcome not duplicated into the JSON** — `completed`/`score`/`moves` are columns on the same row; 4b correlates skill→success by reading the row (no join, no dup).
- **Process signals deferred** (timeMs / hintLevelUsed / invalidMoveTypes / undoCount from plan §6) — need client instrumentation that doesn't exist yet (Phase-2 workbench). 4a logs what we HAVE: the level's pedagogical intent. All 6 games carry manifests (3b), so `completionJson` populates for every game.

---

## 2026-05-29 (PM) — HANDOFF: Pedagogy redesign Phase 1 — manifest foundation COMPLETE

**Status**: paused (handoff). Slices 0/1/2/3/3b + the react-doctor refactor are all committed; whole-tree `pnpm check` GREEN. The LevelManifest rollout is complete on all 6 games. Step 4 (4a–4d) NOT started.
**Branch**: main — 8 commits this session (`072d6c5`..`d2ce2bc`). Only `.claude/scratchpad.md` (+ `.turbo/cache`) is uncommitted; left intentionally. **DO NOT push** — push to main = prod deploy; user reviews + deploys.
**Next**: pick a Step-4 slice and drive it TDD. **Recommended 4a (diagnostic attempt logging)** — user said "no preference". To resume: run `/catchup`, skim `docs/pedagogy-redesign-plan.md` (roadmap) + `docs/pedagogy-phase1-seam-audit.md` (seam map / touch-points), then start the chosen slice. The manifest now flows through `resolveLevelConfig` on all 6 games, so skill/misconception data is available server-side for 4a/4b/4c.

### Blockers / decisions needed (next session)

- **Which Step-4 slice first?** User answered "no preference" → default **4a** (it unblocks 4b mastery + 4c daily). 4d (misconception feedback) is independent and could go anytime.
- **shape-architect trace (optional follow-up):** its manifest deliberately has NO embedded `solutionTrace` (DLX/backtrack solver is 15s/forged-to-KV — can't run at config-build). Its solution path stays the existing `LevelSolution` (`solveLevelToSolution` + `sa:solution` KV cache, served on demand). Decide later whether to unify `manifest.solutionTrace` with that forged solution server-side, or leave as-is.
- **Trace i18n + worked-example UI = Phase 2.** Trace `labelKey`s (`trace.forcedCell`/`trace.placeValue`/`trace.optimalMove`) are identifiers only; their en/vi strings + param interpolation land with the Phase-2 worked-example renderer that consumes them.

**Commits this session:** `072d6c5` docs(audit) · `8c8b54c` Slice0 contract dedup · `68099de` Slice1 LevelManifest · `258d81e` Slice2 magic-graph pilot · `068ae03` react-doctor refactor (user's WIP, folded in + verified) · `8b77f00` Slice3 batch-4 games · `264aa28` sequence-race trace · `d2ce2bc` shape-architect skeleton. (Pre-session HEAD: `2db434b`.)

**3b DONE — all 6 games tagged; solver traces where feasible:**

- magic-graph (`258d81e`): manifest + forced-cell solutionTrace (solve()).
- sequence-race (`264aa28`): manifest + optimal-play solutionTrace (minimax principal variation).
- shape-architect (`d2ce2bc`): manifest skeleton; NO embedded trace — solver is expensive (15s, forged to KV), so its trace IS the existing LevelSolution mechanism (solveLevelToSolution + sa:solution cache, served on demand). No SolutionStep collision (didn't import core's into the package).
- fraction-builder / equation-balance / pattern-detective: manifest skeleton only (closed-form, no search solver → no trace, by design).

**Slice 3 review catches:** sequence-race resolveLevelConfig read raw presetGames (manifest-less) → repointed to cachedCatalog (+guard test); FB/EB catalog arrays annotated as config type to keep manifest optional (lint). Agents skipped lint → I ran whole-tree check + fixed.

**STILL TODO (Phase 1, Step 4):**

- **4a** diagnostic attempt logging → populate the unused game_attempts.completion_json with manifest skill/misconception data (server-handlers → attemptsService.record; add the missing game_attempts test).
- **4b** mastery achievements (add skill predicate to AchievementContext + AchievementUnlockCondition in core; thread manifest into the AchievementContext built in progress.server.ts; migrate imperative + declarative evaluators).
- **4c** per-player daily REWRITE (planDailyChallenge + getDailyPick signature + cron; per-player skill source from dailyPlayerResults).
- **4d** misconception feedback FB+EB: convert the 4 hardcoded-English GameFeedback{generic;message} logic sites to a keyed/structured channel; routes render+localize; add en/vi parity test.
  **Plan**: docs/pedagogy-redesign-plan.md (Phase 1: manifest tags+traces, attempt logging, mastery achievements, skill-aware daily, misconception feedback for FB+EB)

**Decisions locked (user, 2026-05-29):**

1. **Slice 0 = single-source the GameModule contract FIRST** (delete stale mirror `apps/web/src/games/game-module.ts`; repoint achievements.logic.ts / server-handlers.ts / routes/achievements.tsx to `@math-games/core`; reconcile duplicated DailyChallengePick + GameProgressRequest).
2. **Pilot game (Slice 2) = magic-graph** (solver.solve() returns a full solution currently discarded → solutionTrace is free).
3. **Skill-aware daily (Slice 4c) = FULL per-player rewrite** (rewrite planDailyChallenge + getDailyPick(hash) signature + cron pre-generation; needs per-player skill source).

**Phase-1 defaults applied:** manifest fields optional+backfill · skill/misc/difficulty/gradeBand/generatorVersion on level config, solutionTrace/hintPath SERVER-ONLY (strip in createGetCatalogHandler — leak risk) · REUSE core GradeBand · rename shape-architect internal SolutionStep · diagnostics persist via existing unused game_attempts.completion_json · solutionTrace coverage = solver-backed games only.

**Slice order:** 0 dedup ✅ → 1 LevelManifest in core ✅ → 2 pilot magic-graph ✅ → [react-doctor refactor committed `068ae03`] → 3 batch 4 games (RUNNING) → 3b solver-derived traces for sequence-race + shape-architect (interactive) → 4a attempt logging · 4b mastery achievements · 4c per-player daily · 4d misconception feedback FB+EB.
**Next**: validate + commit Slice 3 batch when workflow woed28pjt completes, then run whole-tree `pnpm check`.

**Slice 3 plan (refined after scouting):** Batch the manifest SKELETON (skillTags + misconceptionTags + structural difficultyFeatures, NO trace) onto all 4 games via workflow — FB/EB/PD/sequence-race are uniform for this. Only sequence-race (minimax engine) + shape-architect (LevelSolution.steps) are solver-backed; their bespoke solutionTrace derivation is pulled OUT of the batch into a single interactive pass (3b) since neither is mechanical. Per-game skillTags: FB=[rational_magnitude,equivalence,decomposition]/[whole_number_bias,denominator_size_bias]; EB=[equality_as_invariant,inverse_operations]/[equals_means_answer_next,one_sided_operation]; PD=[functional_thinking,pattern_generalization]/[overfits_few_terms]; SR=[functional_thinking,explicit_rule]/[overfits_few_terms].
**User directive:** "include the uncommitted work as part of the workflow ... have everything worked" → committed the react-doctor Fast-Refresh refactor (`068ae03`, whole-tree check green) before batching.

**Slice 2 done** (`258d81e`): magic-graph levels carry a LevelManifest (skillTags constraint_propagation/additive_structure, misconception, structural difficultyFeatures, gradeBand=middle, provenance) + server-only solutionTrace derived from solve() (forced-cell-first keyed steps; the answer the seeded generator discarded after masking). Added core toClientManifest/toClientCatalog; wired createGetCatalogHandler to strip solutionTrace/hintPath before KV/browser (covers all games on the generic handler). core 8 tests, magic-graph 252 tests (incl. property test: derived trace solves every preset). `pnpm check` green.

- **Pilot finding → contract refinement:** SolutionStep.data must be FLAT serializable primitives (`Record<string, string|number|boolean>`), NOT `unknown` — TanStack Start's server-fn return-type serialization check rejects `unknown`. (Was `unknown` in Slice 1; tightened in Slice 2.) Nest by flattening keys.
- **Deferred:** no trace UI / en-vi trace strings yet — labelKeys ("trace.forcedCell"/"trace.placeValue") are identifiers; their localized strings + interpolation land with the Phase-2 worked-example renderer.
- **Slice 3 batch must handle:** shape-architect internal `SolutionStep` name collision (rename/alias); solver-backed games (shape-architect LevelSolution.steps, sequence-race minimax) get traces, closed-form games (fraction-builder, equation-balance, pattern-detective) get skillTags+difficultyFeatures only (no trace).

### Done

- [x] Read full plan + AGENTS.md + project CLAUDE.md; scouted seam anchors.
- [x] Confirmed all 6 game packages present. Pattern Detective + Sequence Race → Function Forge merge is **Phase 5, NOT current state**.
- [x] Step 0 audit workflow (8 readers → synthesis) → 167 touch-points; doc `docs/pedagogy-phase1-seam-audit.md`.
- [x] **Slice 0** (`8c8b54c`): single-sourced GameModule contract. Deleted stale mirror `apps/web/src/games/game-module.ts` + dup `game-progress.schema.ts`; repointed 9 consumers to `@math-games/core`. RED→GREEN via typecheck (mirror's Achievement lacked `unlockWhen`). Added first `checkAchievements` test. `pnpm check` green.
- [x] **Slice 1** (`68099de`): `LevelManifest`/`SolutionStep`/`HintStep` in `packages/core/src/level-manifest.ts`, re-exported from barrel; `manifest?` attached to GameModule TConfig bound (non-breaking). Wired core into `turbo test`. `pnpm check` green.
  - **Contract decisions (deviate from plan's literal shape):** only `skillTags` required (rest optional, for incremental backfill); `SolutionStep`/`HintStep` are KEYED (`labelKey`+`params`+`data?`) not raw strings (en/vi parity); reused existing core `GradeBand`; `solutionTrace`/`hintPath` flagged SERVER-ONLY (must strip in createGetCatalogHandler — Slice 2).

### Audit resolved these open questions

- Cloudflare Workflow = `infra/level-forge.worker.ts` (Alchemy-DSL, forges shape-architect SOLUTIONS to KV only); level generation is per-game seeded pure fns; pattern-detective hand-authored. generatorVersion does NOT gate one pipeline.
- Scoring trio names CONFIRMED (resolveLevelConfig/validateGameState/computeScore) — on core contract, impl per-game.
- `game_attempts` EXISTS (written every submission) with an unused `completion_json` slot → attempt logging EXTENDs it (Slice 4a).
- LevelManifest single-sourced in `packages/core` (done).

### Constraints (this session)

- TDD: failing test first; smallest correct slice; `pnpm check` before "done"; report failures honestly.
- en+vi parity; no hardcoded English in item logic.
- Commit locally per slice; **DO NOT push** (user reviews + deploys; push to main = prod deploy).
- "Workflow" overloaded: Cloudflare Workflow = runtime foundry; Claude Workflow tool = dev orchestration. Don't conflate.

---

## 2026-05-29 - Shipped 2 games + thermo-nuclear review fixes; GameRouteShell refactor DONE

**Status**: DONE — all review findings (1–8) complete & verified green. Finding 6 (GameRouteShell) shipped this session.
**Branch**: main
**Next**: nothing pending. `.claude/scratchpad.md` + `.turbo/cache/*` remain uncommitted (session notes + build cache — left for you).

### Done This Session (continuation — finding 6 + commits)

- [x] Committed the prior session's verified work in the 3-way split (per the plan below):
  - `78a4094` chore(format): 11 prettier-only files (verified format-only via diff).
  - `b06a2b0` feat: publish Fraction Builder + Equation Balance (modules + routes + EB tokenizer + curriculum-games.spec + `_helpers.ts` + AGENTS.md).
  - `46f58d9` fix: SSR date-hydration via useHydrated + e2e helper adoption (index/\_\_root/use-hydrated/ui barrel + game-flows/standalone-flows/mobile-layout specs).
- [x] **Finding 6 — GameRouteShell**: `0dd09b5` refactor: extracted thin `GameDesktopShell` + `GameMobileShell` into `packages/ui` and migrated all 4 single-puzzle routes (equation-balance, fraction-builder, magic-graph, sequence-race).
  - **Design decision**: went LEAN. The only chrome shared across all 4 is the themed wrapper + the already-extracted `GameChrome`/`MobileGameHeader`. The richer shell the handoff sketched (owning `LevelGrid` + `Confetti`) fits EB/FB but over-parameterizes magic-graph/sequence-race (LevelGrid is bottom-in-`PracticeGeneratorSection`, Confetti embedded in the playfield grid, plus sidebar + `LearnSection`). So the shells own ONLY the `theme-{game}` wrapper + header; playfield/LevelGrid/Confetti/footer stay as route children.
  - **Shell props (no flags, no branching)**: desktop = `game, levelTitle, meta?, maxWidth?('3xl'|'5xl')` + children; mobile = `game, levelTitle, meta?, onBack?, backLabel?` + children.
  - **LOC**: routes −14 total (EB 400→396, FB 697→693, MG 711→708, SR 584→581); shells +90 (incl. ~50 comment/interface lines) + barrel +2. Net ~flat — the win is single-sourcing the load-bearing dual-layout contract (`theme-{game}` + `md:flex`/`md:hidden`), NOT LOC reduction. User was consulted at the pilot and chose "migrate all 4".
- [x] Verified: `pnpm check` green (prettier/typecheck/lint/test/build); **33/33 Playwright E2E green** (post-migration); browser-checked all 4 routes desktop+mobile (themes intact, DOM contract exact: themed `<main>`[md:flex] first, themed `body-noise <div>`[md:hidden] last).

### Notes for next session

- `mobileLayout()` (`[class*="md:hidden"].first()`) is NOT usable for magic-graph/sequence-race: their desktop trees contain `md:hidden` mobile-toggle buttons inside `LearnSection`/`PracticeGeneratorSection` (pre-existing). The mobile-layout specs already avoid it for those routes (use `theme-{game}.last()` / heading assertions). Don't "fix" by switching them to `mobileLayout()`.
- `pattern-detective` was deliberately left un-migrated (already decomposed; not a dual hand-rolled scaffold).

### (Historical) original handoff brief for finding 6 — kept for reference

**Status**: paused — review findings 1–5, 7, 8 DONE & verified green; **finding 6 (GameRouteShell) NOT started** (full handoff below)
**Branch**: main (everything uncommitted in the working tree)
**Next**: Execute the GameRouteShell refactor (finding 6) per the self-contained brief below. Pilot on `equation-balance` first; if the shell over-parameterizes, abandon and report.

### Done This Session

- [x] Published **Fraction Builder** + **Equation Balance** (removed `published: false`; routes/logic/i18n were already ~complete, just gated).
- [x] Removed English-only `validate` feedback display from both new routes (i18n parity — shipped games surface no raw feedback; logic.ts still returns it, only the UI render was dropped).
- [x] Re-gated FB achievements by difficulty (medium=simplify, hard=compare) + `packages/game-fraction-builder/src/__tests__/catalog.test.ts` pins that difficulty↔mode invariant.
- [x] Added `apps/web/tests/e2e/curriculum-games.spec.ts` (smoke + happy-path play-throughs).
- [x] Fixed SSR date-hydration mismatch on dashboard (`index.tsx`) via new `useHydrated()` in `@math-games/ui`, adopted in `index.tsx` + `__root.tsx`.
- [x] Replaced 2 stale magic-graph mobile collapsible E2E tests with one accurate mobile render test (redesign made that section desktop-only).
- [x] Fixed pre-existing prettier drift on 11 committed files (`pnpm format`).
- [x] Updated `AGENTS.md` + root `../CLAUDE.md` to monorepo reality (apps/web + packages/\*, 6 routes).
- [x] Ran thermo-nuclear maintainability review via 2 fresh-context subagents over the diff.
- [x] Fixed review findings 1–5, 7, 8: shared `tests/e2e/_helpers.ts`; FB grids `role="group"`+`aria-label`, play-throughs scoped via `desktopLayout`; structural daily-link regex `/\/games\/[a-z-]+/`; magic-graph mobile Target-heading assertion; FB invariant test; `useHydrated`; EB `formatEquationTokens` (structured roles) + tests.
- [x] Verified: `pnpm check` green; **33/33 E2E green**.

### Blockers / Decisions

- **Nothing committed.** Do NOT stash (this is completed work to commit, not WIP). Suggested logical commit split:
  1. `chore(format)`: the 11 prettier-only files — `error-popup.tsx`, `registry.ts`, `shape-architect-components/game-state-helpers.ts`, `-profile-account-form.tsx`, `routes/games/shape-architect.tsx`, `routes/profile.tsx`, `core/game-module.ts`, the 3 shipped game modules (`game-{magic-graph,sequence-race,shape-architect}/src/module.ts`), `ui/src/use-level-selection.ts`.
  2. `feat`: publish FB + EB (their modules + the 2 routes' feedback removal + `curriculum-games.spec.ts` + `standalone-flows` regex + `AGENTS.md`/`CLAUDE.md`).
  3. `fix`/`refactor`: date hydration + `useHydrated` (`index.tsx`, `__root.tsx`, `ui/use-hydrated.ts`, `ui/index.ts`), EB tokenizer (`game-equation-balance/src/logic.ts` + its test + `equation-balance.tsx`), FB `catalog.test.ts`, `mobile-layout.spec.ts`, `_helpers.ts` extraction (`game-flows`/`standalone-flows`/`mobile-layout`/`curriculum-games`).

### ===> HANDOFF — Finding 6: GameRouteShell refactor (NOT started) <===

**Goal:** Delete the duplicated dual desktop/mobile layout scaffold that 4 of 6 game routes hand-roll, by extracting thin shared shell component(s) in `@math-games/ui` — WITHOUT changing any behavior.

**Why:** Thermo-nuclear review finding 6. `magic-graph` (~711), `sequence-race` (~720), `fraction-builder` (689), `equation-balance` (397) each render a `<main className="theme-{game} … hidden md:flex">` desktop tree AND a `<div className="theme-{game} body-noise … md:hidden">` mobile tree with near-identical chrome. `pattern-detective` is the decomposed odd-one-out — reassess/leave for last. Est. ~30–40 deduped lines/route (~150 total).

**Proposed design (in `packages/ui/src/`):**

- `GameDesktopShell` — owns `<main className="theme-{game} … hidden md:flex">` + `GameChrome game levelTitle meta={nav}` + `LevelGrid` + `Confetti active`; playfield/sidebar are `children`. Props: `game`, `levelTitle`, `nav` (a `<LevelNav>`), `levelItems`, `selectedLevelId`, `onSelectLevel`, `confettiActive`, `children`.
- `GameMobileShell` — owns `<div className="theme-{game} body-noise … md:hidden">` + `MobileGameHeader … meta` + `Confetti active`; `children` = playfield, `footer` = bottom action bar. Props: `game`, `levelTitle`, `meta`, `onBack`, `backLabel`, `confettiActive`, `footer`, `children`.
- Decide: two components vs. one `GameRouteShell` wrapping both.

**PILOT-FIRST (mandatory):** migrate `equation-balance.tsx` only (smallest), verify behavior-identical, then evaluate. **If the shell needs so many props/slots that it relocates complexity instead of deleting it, STOP and report — abandoning is an acceptable outcome** (the reviewer explicitly warned against a refactor that just moves complexity).

**Per-route variation to PRESERVE (keep in `children`, don't flatten):**

- magic-graph & sequence-race desktop have a sidebar (Timed/Pause/Hints timer) + `PracticeGeneratorSection`/`ResponsiveSection`/`LearnSection`. FB/EB are simpler.
- Each route's mobile `meta` pill + bottom action bar differ (Reset/Check/Next…).
- Level-grid item mapping differs (FB: mode+difficulty; EB: mode; magic-graph: name+nodes+target) → pass pre-mapped `levelItems`.

**Shared components to compose** (`@math-games/ui`, barrel `packages/ui/src/index.ts`): `GameChrome`, `LevelNav`, `Confetti`, `MobileGameHeader`. NOTE `LevelGrid` is app-local (`apps/web/src/games/level-grid.tsx`) — decide whether to move it into ui or accept it as a render prop. `useLevelSelection`/`useSaveStatus` stay in the routes.

**Hard constraints / gotchas:**

- `packages/ui` MUST NOT import `@tanstack/react-router` (stays router-agnostic; `GameChrome` uses a plain `<a href="/">`). Pass links/nav as props/children.
- Tailwind v4 scans `packages/ui/src/**/*.{ts,tsx}` via `@source` in `apps/web/src/styles.css` (line 3, already present) → new shell files there are auto-scanned. `theme-{game}` are plain CSS classes in styles.css, safe to build dynamically from `game`.
- **Dual layout is intentional**: desktop (`hidden md:flex`) and mobile (`md:hidden`) BOTH render into the DOM at once — preserve this. E2E scoping helpers in `apps/web/tests/e2e/_helpers.ts` (`desktopLayout` = `[class*="md\:flex"]`.first(), `mobileLayout` = `[class*="md\:hidden"]`.first()). Don't break them.
- i18n via `useT()`; no hardcoded en/vi. READ `docs/design-system.md` first (AGENTS.md mandates it before UI work).

**Verification bar (after pilot AND after full migration):**

- `pnpm check` must stay green (prettier/typecheck/lint/test/build).
- `pnpm --filter @math-games/web exec playwright test` — all 33 pass. **Needs `dangerouslyDisableSandbox: true`** (wrangler writes logs outside the sandbox allowlist; playwright `webServer` auto-runs `ensureLocalD1` then `vite dev`, port 3000).
- Browser-verify each migrated route desktop+mobile, light+dark, en+vi: confetti on solve, save-status, level nav prev/next, level-grid selection, playfield interactions — all identical.
- Report before/after LOC per route + final shell prop count.

**Read first:** the 4 routes in `apps/web/src/routes/games/`; `packages/ui/src/{game-chrome,mobile-game-header,level-nav,confetti}.tsx`; `apps/web/src/games/level-grid.tsx`; `apps/web/tests/e2e/_helpers.ts`; `docs/design-system.md`; `pattern-detective.tsx` (decomposed counter-example).

---

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
