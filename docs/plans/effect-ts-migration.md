# Effect TS Migration Plan

**Goal**: Migrate the entire math-games application from plain async/await + custom Error classes to Effect TS pipelines, services, and typed error channels.

**Current state**: Effect 4.0.0-beta.66 is a dependency but only used in `alchemy.run.ts` for IaC. All app code uses plain TypeScript.

**What stays plain TypeScript**: React components (routes, hooks, state), Drizzle schema definitions, `alchemy.run.ts` (already Effect).

---

## Phase 1 — Services & Error Types (foundation)

No behavior change. Establish the Effect service layer and error vocabulary.

### 1a. Define Effect services

Create `src/services/` with:

- **`DbService`** — wraps `createDb(env.DB)` from `src/db/index.ts`. Provides a `db` accessor. The Cloudflare Worker `env.DB` binding is the dependency.
- **`PlayerIdentityService`** — wraps `getCurrentPlayerId()` and `createPlayerIdentity()` from `src/player/identity.server.ts`.
- **`RateLimitService`** — wraps `assertNotRateLimited(key)` from `src/server/rate-limit.ts`.
- **`OriginGuardService`** — wraps `assertSameOriginPost()` from `src/server/origin-guard.ts`.

Each service is a `Context.Tag` with a `make` function and a `Layer` constructor.

### 1b. Convert Error classes to `Data.TaggedError`

Current custom errors and their replacements:

| Current class | File | Effect replacement |
|---|---|---|
| `ProgressWriteError` | `progress.server.ts` | `Data.TaggedError("ProgressWriteError")` |
| `GameProgressValidationError` | `server-handlers.ts` | `Data.TaggedError("GameProgressValidationError")` |
| `DailyChallengeError` | `daily.server.ts` | `Data.TaggedError("DailyChallengeError")` |
| `PlayerProfileError` | `profile.server.ts` | `Data.TaggedError("PlayerProfileError")` |
| `PlayerProfileWriteError` | `profile.server.ts` | `Data.TaggedError("PlayerProfileWriteError")` |
| `RateLimitError` (thrown by assertNotRateLimited) | `rate-limit.ts` | `Data.TaggedError("RateLimitError")` |
| `OriginError` (thrown by assertSameOriginPost) | `origin-guard.ts` | `Data.TaggedError("OriginError")` |

Place these in `src/services/errors.ts`.

### 1c. Create `AppLayer`

`src/services/app-layer.ts` — composes all service layers into a single `AppLayer` that can be provided at the server function boundary. Built from the Cloudflare Worker `env.DB` binding.

```
AppLayer = DbService.layer + PlayerIdentityService.layer + RateLimitService.layer + OriginGuardService.layer
```

### 1d. Verification

- All existing tests still pass (no behavior change yet)
- `pnpm typecheck` passes
- Services are importable but not yet wired in

---

## Phase 2 — Server Workflows

Convert all server-side pipelines to Effect. This is the highest-value phase.

### 2a. `recordGameProgress` pipeline

File: `src/games/progress/progress.server.ts`

Current flow (try/catch):
```
try {
  db = createDb(env.DB)
  [achievements, attemptsByGame] = await db.batch([...])  // Phase 1 read
  unlockedAchievements = checkAchievements(...)
  writeResults = await db.batch([...])                      // Phase 2 write
  return toProgressRecord(progress, unlockedAchievements)
} catch (cause) {
  throw new ProgressWriteError(cause)
}
```

Effect pipeline:
```
Effect.gen(function* () {
  const db = yield* DbService
  const [achievements, attemptsByGame] = yield* Effect.tryPromise({
    try: () => db.batch([...]),
    catch: (cause) => new ProgressWriteError({ cause })
  })
  // ... compute achievements ...
  const writeResults = yield* Effect.tryPromise({
    try: () => db.batch([...]),
    catch: (cause) => new ProgressWriteError({ cause })
  })
  return toProgressRecord(...)
})
```

Error channel: `ProgressWriteError`

### 2b. `createRecordProgressHandler` pipeline

File: `src/games/server-handlers.ts`

Current flow (imperative):
```
assertSameOriginPost()
setResponseHeader(...)
playerId = getCurrentPlayerId()
assertNotRateLimited(...)
level = module.resolveLevelConfig(...)
validation = module.validateGameState(...)
score = module.computeScore(...)
return recordGameProgress(...)
```

Effect pipeline — each step is a composable Effect:
```
Effect.gen(function* () {
  yield* OriginGuardService.assert()
  yield* Effect.sync(() => setResponseHeader(...))
  const playerId = yield* PlayerIdentityService.getCurrentId()
  yield* RateLimitService.assert(`record:${module.id}:${playerId}`)
  const level = yield* resolveLevel(module, data.levelId)
  const { completed, moves } = yield* validateState(module, level, data.completion)
  const score = module.computeScore({ completed, moves })
  return yield* recordGameProgress({ playerId, ... })
})
```

Error channel: `OriginError | RateLimitError | GameProgressValidationError | ProgressWriteError`

### 2c. Daily challenge & profile workflows

Files: `src/daily/daily.server.ts`, `src/player/profile.server.ts`

Same pattern — wrap DB calls in `Effect.tryPromise`, use services for dependencies, expose typed error channels.

### 2d. Bridge at `createServerFn` boundary

Each `*.functions.ts` file is the React↔Effect boundary. Pattern:

```typescript
export const recordXxxProgress = createServerFn({ method: 'POST' })
  .validator(validateGameProgressRequest)
  .handler(({ data }) =>
    recordProgressPipeline(xxxModule, data).pipe(
      Effect.provide(AppLayer),
      Effect.runPromise,
    )
  )
```

Errors that escape `runPromise` become rejected promises, which TanStack Start serializes to the client. Map Effect failures to user-facing error messages at this boundary.

### 2e. Verification

- All E2E tests pass (behavior unchanged, just internal plumbing)
- Unit tests updated to test Effect pipelines with mock service layers
- `pnpm check` passes

---

## Phase 3 — Game Engine Logic

Lower priority. Convert pure game logic functions to Effect where it adds value.

### 3a. Solver with structured cancellation

File: `src/games/ShapeArchitect/logic/solver.ts`

Current: polls `performance.now()` against `maxTimeMs` inside the recursive loop.

Effect approach:
```
Effect.gen(function* () {
  // Use Effect.timeout or Effect.raceFirst with a timer
  const result = yield* solvePipeline(level).pipe(
    Effect.timeout(Duration.millis(maxTimeMs)),
    Effect.option  // None = timed out
  )
})
```

The recursive backtracking itself becomes an Effect generator that yields at each search state, allowing structured interruption.

Also consider wrapping in `Effect.async` for Web Worker offloading (see Shape Architect optimization plan).

### 3b. Seeded generator as Effect

File: `src/games/ShapeArchitect/logic/seededGenerator.ts` (851 lines)

The generator has multiple fallible steps: target shape generation, piece decomposition, solvability verification. These compose naturally as an Effect pipeline where each step can fail with a `GenerationError`.

### 3c. Validation pipelines per game module

Each game's `module.ts` has `validateGameState` + `computeScore`. Compose these into a single Effect pipeline that returns `{ completed, moves, score }` or fails with `GameProgressValidationError`.

This makes the `createRecordProgressHandler` pipeline cleaner — the per-game validation is self-contained.

### 3d. Verification

- All game logic unit tests updated
- Solver tests verify timeout behavior via Effect's test clock
- `pnpm check` passes

---

## File inventory

Files to create:
- `src/services/db.ts`
- `src/services/player-identity.ts`
- `src/services/rate-limit.ts`
- `src/services/origin-guard.ts`
- `src/services/errors.ts`
- `src/services/app-layer.ts`
- `src/services/index.ts`

Files to modify:
- `src/games/server-handlers.ts` — Effect pipeline
- `src/games/progress/progress.server.ts` — Effect pipeline
- `src/daily/daily.server.ts` — Effect pipeline
- `src/daily/daily.logic.ts` — minor (if it throws)
- `src/player/profile.server.ts` — Effect pipeline
- `src/player/identity.server.ts` — service extraction
- `src/server/origin-guard.ts` — service extraction
- `src/server/rate-limit.ts` — service extraction
- `src/games/ShapeArchitect/logic/solver.ts` — Effect + structured cancellation
- `src/games/ShapeArchitect/logic/seededGenerator.ts` — Effect pipeline
- `src/games/MagicGraph/module.ts` — validation pipeline
- `src/games/SequenceRace/module.ts` — validation pipeline
- `src/games/ShapeArchitect/module.ts` — validation pipeline
- `src/games/MagicGraph/magic-graph.functions.ts` — bridge
- `src/games/SequenceRace/sequence-race.functions.ts` — bridge
- `src/games/ShapeArchitect/shape-architect.functions.ts` — bridge
- `src/daily/daily.functions.ts` — bridge
- `src/player/profile.functions.ts` — bridge
- `src/effect/__tests__/server-workflows.test.ts` — update tests

Files to delete (after migration):
- Custom Error class definitions from their original files (replaced by `src/services/errors.ts`)

---

## Risks & decisions

1. **Effect 4.x beta**: API may shift. Pin exact version and track changelogs.
2. **TanStack Start compatibility**: `createServerFn` handlers must return serializable values. `Effect.runPromise` at the boundary handles this — the pipeline is internal, the return type is a plain object.
3. **Cloudflare Workers compatibility**: Effect's runtime uses standard JS. No Node-specific APIs. Should work on Workers but test early.
4. **Bundle size**: Effect tree-shakes well but adds ~30-50KB gzipped to server bundle. Not an issue for Workers (runs server-side) but verify.
