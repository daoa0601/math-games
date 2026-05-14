# Effect Maximization Plan

**Precondition**: The current 5-step plan is complete — CI green, dead wrappers deleted, `runServerEffect` boundary in place, validators lifted to Effect, success-path tests passing.

**Effect version**: `effect@4.0.0-beta.66` (v4 beta). Schema is in the main `effect` package. `@effect/vitest@4.0.0-beta.66` is available transitively but must be added as a direct devDependency.

**Goal**: Effect becomes the application core. React/TanStack Start are thin adapters at the edges. All fallible, async, environment-dependent, or workflow-like code runs as Effect programs. Pure deterministic kernels stay pure but are orchestrated by Effect.

**Target shape**:

```
React UI / route handlers          ← adapters, never run Effect
  → runServerEffect() is the only boundary
Effect application services        ← validation, auth, rate limit, progress, profile, daily, game workflows
  → Schema parsing, typed errors, service composition
Pure game kernels                  ← called BY Effect programs
  → deterministic math, solvers, generators
Infrastructure layers              ← D1, headers/cookies, clock, random, config, logging
  → Effect services with typed dependencies, composed into AppLayer
```

---

## Phase 0: ManagedRuntime + Retry Policy (Foundation)

### Why this is Phase 0

The current `runServerEffect` rebuilds the layer graph on every request:

```typescript
// Current — layer construction per invocation
export function runServerEffect<A, E extends ServerError>(
  effect: Effect.Effect<A, E, AppServices>,
): Promise<A> {
  return effect.pipe(
    Effect.mapError(toUserFacingError),
    Effect.provide(AppLayer),   // ← rebuilds every call
    Effect.runPromise,
  )
}
```

`ManagedRuntime` builds the layer graph once at module scope, reuses it across all requests within a Cloudflare Workers isolate. This is the single most impactful change.

### 0a. Switch `runServerEffect` to `ManagedRuntime`

**File**: `src/services/run-server-effect.ts`

```typescript
import { Effect, ManagedRuntime, Match } from 'effect'
import { AppLayer } from './app-layer'

const runtime = ManagedRuntime.make(AppLayer)

export function runServerEffect<A, E extends ServerError>(
  effect: Effect.Effect<A, E, AppServices>,
): Promise<A> {
  return runtime.runPromise(
    effect.pipe(
      Effect.tapError((e) => Effect.log(`Server error [${e._tag}]`)),
      Effect.mapError(toUserFacingError),
    ),
  )
}
```

### 0b. Use `Match.exhaustive` for error mapping

Replace the `switch` in `toUserFacingError` with `Match` — compile-time exhaustiveness means adding a new error variant forces you to handle it everywhere:

```typescript
import { Match } from 'effect'

const toUserFacingError = Match.type<ServerError>().pipe(
  Match.tag('RateLimitError', () => new Error('Too many requests. Please wait a moment.')),
  Match.tag('CrossOriginError', () => new Error('Request blocked.')),
  Match.tag('GameProgressValidationError', (e) => new Error(e.reason)),
  Match.tag('PlayerProfileValidationError', (e) => new Error(e.reason)),
  Match.tag('ProgressWriteError', () => new Error('Unable to save game progress.')),
  Match.tag('DailyChallengeError', () => new Error("Unable to load today's challenge.")),
  Match.tag('PlayerProfileError', () => new Error('Unable to load your profile.')),
  Match.tag('PlayerProfileWriteError', () => new Error('Unable to save your profile.')),
  Match.exhaustive,
)
```

### 0c. Add D1 retry policy

D1 on Cloudflare has transient failures. Wrap DB operations with a composable retry:

**File**: `src/services/retry.ts`

```typescript
import { Effect, Schedule } from 'effect'

export const d1RetryPolicy = Schedule.exponential('50 millis').pipe(
  Schedule.intersect(Schedule.recurs(3)),
  Schedule.jittered,
)

export function withD1Retry<A, E, R>(
  effect: Effect.Effect<A, E, R>,
): Effect.Effect<A, E, R> {
  return Effect.retry(effect, d1RetryPolicy)
}
```

Apply to all `Effect.tryPromise` calls that wrap `db.batch()` / `db.select()` / `db.insert()`:

```typescript
// Before
yield* Effect.tryPromise({
  try: () => db.batch([...]),
  catch: (cause) => new ProgressWriteError({ cause }),
})

// After
yield* withD1Retry(
  Effect.tryPromise({
    try: () => db.batch([...]),
    catch: (cause) => new ProgressWriteError({ cause }),
  }),
)
```

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 1: Expand the Service Layer

### What exists after the current plan

| Service | Implementation | Notes |
|---------|---------------|-------|
| `DbService` | `Layer.sync` → `createDb(env.DB)` | Exposes raw `AppDatabase` |
| `PlayerIdentityService` | `Layer.succeed` → sync wrappers | Wraps `getCurrentPlayerId()` / `getCurrentPlayerIdentity()` |
| `OriginGuardService` | `Layer.succeed` → `Effect.try` wrappers | Wraps `assertSameOriginPost()` |
| `RateLimitService` | `Layer.succeed` → `Effect.try` wrappers | Wraps `assertNotRateLimited()` |

### 1a. Add `ClockService`

**Why**: `loadDailyChallenge` hardcodes `new Date()`. Tests that depend on "today" are flaky. A `ClockService` makes time injectable — and `@effect/vitest`'s `TestClock` can control it.

**File**: `src/services/clock.ts`

```typescript
import { Context, Effect, Layer } from 'effect'

export interface ClockShape {
  readonly now: () => Effect.Effect<Date>
  readonly dateKey: () => Effect.Effect<string>
}

export const ClockService = Context.Service<ClockShape>('ClockService')

export const ClockServiceLive = Layer.succeed(ClockService, {
  now: () => Effect.sync(() => new Date()),
  dateKey: () => Effect.sync(() => new Date().toISOString().slice(0, 10)),
})
```

**Callers to update**:
- `src/daily/daily.server.ts:29` — `loadDailyChallenge(date = new Date())` → yield `ClockService.dateKey()` instead of accepting a param
- Add `ClockShape` to `AppServices` union in `run-server-effect.ts`
- Add `ClockServiceLive` to `AppLayer`

### 1b. Add `RandomService`

**Why**: `createPlayerId()` calls `crypto.randomUUID()` directly. Tests can't control UUID generation. A `RandomService` makes it injectable.

**File**: `src/services/random.ts`

```typescript
export interface RandomShape {
  readonly uuid: () => Effect.Effect<string>
}

export const RandomService = Context.Service<RandomShape>('RandomService')

export const RandomServiceLive = Layer.succeed(RandomService, {
  uuid: () => Effect.sync(() => crypto.randomUUID()),
})
```

### 1c. Add `HeaderService`

**Why**: `getRequestHeader` and `setResponseHeader` from `@tanstack/react-start/server` are called bare inside Effect pipelines. This couples Effect programs to TanStack. A `HeaderService` makes tests independent of the framework — no more `vi.mock('@tanstack/react-start/server', ...)`.

**File**: `src/services/headers.ts`

```typescript
export interface HeaderShape {
  readonly getRequest: (name: string) => Effect.Effect<string | null>
  readonly setResponse: (name: string, value: string) => Effect.Effect<void>
}

export const HeaderService = Context.Service<HeaderShape>('HeaderService')

export const HeaderServiceLive = Layer.succeed(HeaderService, {
  getRequest: (name) => Effect.sync(() => getRequestHeader(name) ?? null),
  setResponse: (name, value) => Effect.sync(() => setResponseHeader(name, value)),
})
```

**Callers to update**:
- `src/games/server-handlers.ts:82-83` — `Effect.sync(() => setResponseHeader(...))` → `yield* (yield* HeaderService).setResponse(...)`
- `src/services/origin-guard.ts` — refactor to depend on `HeaderService` instead of importing `assertSameOriginPostImpl`
- `src/services/player-identity.ts` — refactor to depend on `HeaderService` instead of importing `getRequestHeader`
- `src/daily/daily.functions.ts:5` and `src/player/profile.functions.ts:5` — bare `setResponseHeader` calls outside Effect; move into pipelines

### 1d. Add `WorkerEnvService`

**Why**: `DbServiceLive` imports `env` from `cloudflare:workers` at the module level. In tests, this import doesn't exist. A `WorkerEnvService` makes the D1 binding injectable.

**File**: `src/services/worker-env.ts`

```typescript
export interface WorkerEnvShape {
  readonly getD1: () => D1Database
}

export const WorkerEnvService = Context.Service<WorkerEnvShape>('WorkerEnvService')

export const WorkerEnvServiceLive = Layer.sync(WorkerEnvService, () => {
  const { env } = require('cloudflare:workers')
  return { getD1: () => env.DB }
})
```

**Then**: `DbServiceLive` becomes a `Layer.effect` that depends on `WorkerEnvService`:

```typescript
export const DbServiceLive = Layer.effect(DbService,
  Effect.map(WorkerEnvService, (env) => ({ db: createDb(env.getD1()) }))
)
```

### 1e. Add `AppConfig` via `Config`

**Why**: Rate limit windows (`250ms`), solver timeouts (`5000ms`), cookie max-age (`365 days`), and display name length (`40`) are hardcoded constants. `Config` makes them typed, environment-overridable, and testable via `ConfigProvider.fromMap`.

**File**: `src/services/config.ts`

```typescript
import { Config, ConfigProvider, Effect } from 'effect'

export const AppConfig = Config.all({
  rateLimitWindowMs: Config.integer('RATE_LIMIT_WINDOW_MS').pipe(
    Config.withDefault(250),
  ),
  solverTimeoutMs: Config.integer('SOLVER_TIMEOUT_MS').pipe(
    Config.withDefault(5000),
  ),
  cookieMaxAge: Config.integer('COOKIE_MAX_AGE').pipe(
    Config.withDefault(60 * 60 * 24 * 365),
  ),
  displayNameMaxLength: Config.integer('DISPLAY_NAME_MAX_LENGTH').pipe(
    Config.withDefault(40),
  ),
})

export type AppConfigShape = Effect.Effect.Success<typeof AppConfig>
```

In tests, swap the provider:

```typescript
const testConfig = ConfigProvider.fromMap(new Map([
  ['RATE_LIMIT_WINDOW_MS', '1'],
  ['SOLVER_TIMEOUT_MS', '100'],
]))

const testEffect = myEffect.pipe(Effect.withConfigProvider(testConfig))
```

### 1f. Add structured logging

**Why**: When `ProgressWriteError` fires, nothing is logged server-side. Effect's built-in `Effect.log` works with the runtime's logger. Wire `Effect.tapError` in `runServerEffect` (already done in Phase 0a).

For Cloudflare Workers, the default `console` logger is fine. No custom `LoggerService` needed — just use `Effect.log`, `Effect.logDebug`, `Effect.logError` directly in pipelines.

### 1g. Updated `AppLayer` after Phase 1

```typescript
export const AppLayer = Layer.mergeAll(
  WorkerEnvServiceLive,
  DbServiceLive,              // depends on WorkerEnvService via Layer.provide
  PlayerIdentityServiceLive,  // depends on HeaderService, RandomService
  RateLimitServiceLive,       // depends on ClockService
  OriginGuardServiceLive,     // depends on HeaderService
  ClockServiceLive,
  RandomServiceLive,
  HeaderServiceLive,
).pipe(
  Layer.provide(WorkerEnvServiceLive),  // satisfy DbServiceLive's dependency
)
```

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 2: Branded Types + Effect Schema

### 2a. Brand `PlayerId`, `GameId`, `LevelId`

**Why**: The app passes player IDs, game IDs, and level IDs as plain strings. Nothing prevents `getPlayer(gameId)` — a game ID where a player ID is expected. `Schema.brand` creates nominal types with zero runtime overhead.

**File**: `src/services/branded.ts`

```typescript
import { Schema } from 'effect'

export const PlayerId = Schema.String.pipe(Schema.brand('PlayerId'))
export type PlayerId = typeof PlayerId.Type

export const GameId = Schema.Literal('magic-graph', 'sequence-race', 'shape-architect').pipe(
  Schema.brand('GameId'),
)
export type GameId = typeof GameId.Type

export const LevelId = Schema.String.pipe(
  Schema.nonEmptyString(),
  Schema.brand('LevelId'),
)
export type LevelId = typeof LevelId.Type
```

**Migration**: Replace `string` with branded types in:
- `RecordGameProgressInput.playerId` → `PlayerId`
- `RecordGameProgressInput.gameId` → `GameId`
- `RecordGameProgressInput.levelId` → `LevelId`
- `GameModule.id` → `GameId`
- Service method signatures

Branded types are erased at runtime. Existing code compiles by adding `as PlayerId` at construction boundaries (or better, by parsing through the schema). Type errors at misuse sites are the whole point.

### 2b. Define `GameProgressRequestSchema`

**File**: `src/games/game-progress.schema.ts`

```typescript
import { Schema } from 'effect'
import { LevelId } from '@/services/branded'

export class GameProgressRequest extends Schema.Class<GameProgressRequest>(
  'GameProgressRequest',
)({
  levelId: LevelId,
  completion: Schema.Unknown.pipe(
    Schema.filter((v): v is {} => v !== null && v !== undefined, {
      message: () => 'Missing completion payload',
    }),
  ),
}) {}
```

Using `Schema.Class` here gives us validated construction — `new GameProgressRequest(raw)` throws on invalid input, and `Schema.decodeUnknown(GameProgressRequest)` returns `Effect<GameProgressRequest, ParseError>`.

### 2c. Define `PlayerProfileInputSchema`

**File**: `src/player/profile.schema.ts`

```typescript
import { Schema } from 'effect'

const DisplayName = Schema.String.pipe(
  Schema.transform(Schema.String, {
    strict: true,
    decode: (s) => s.trim().replace(/\s+/g, ' '),
    encode: (s) => s,
  }),
  Schema.filter((s) => s.length >= 2 && s.length <= 40, {
    message: () => 'Display name must be 2-40 characters',
  }),
)

const Locale = Schema.Literal('en', 'vi')
const GradeBand = Schema.Literal('elementary', 'middle', 'high')

export class PlayerProfileInput extends Schema.Class<PlayerProfileInput>(
  'PlayerProfileInput',
)({
  displayName: DisplayName,
  locale: Locale,
  gradeBand: GradeBand,
}) {}
```

### 2d. Define per-game completion schemas

Lift the *structural* validation from `validateGameState` into schemas. Keep *semantic* validation (puzzle correctness, rule enforcement) as pure functions.

**`src/games/MagicGraph/magic-graph.schema.ts`**:

```typescript
export class MagicGraphCompletion extends Schema.Class<MagicGraphCompletion>(
  'MagicGraphCompletion',
)({
  nodeValues: Schema.Record({
    key: Schema.String,
    value: Schema.Union(Schema.Number.pipe(Schema.int()), Schema.Null),
  }),
}) {}
```

**`src/games/SequenceRace/sequence-race.schema.ts`**:

```typescript
export class SequenceRaceCompletion extends Schema.Class<SequenceRaceCompletion>(
  'SequenceRaceCompletion',
)({
  history: Schema.Array(Schema.Struct({
    actor: Schema.Literal('player', 'ai'),
    move: Schema.Unknown,
  })),
}) {}
```

**`src/games/ShapeArchitect/shape-architect.schema.ts`**:

```typescript
const RotationAngle = Schema.Literal(0, 90, 180, 270)

export class ShapeArchitectCompletion extends Schema.Class<ShapeArchitectCompletion>(
  'ShapeArchitectCompletion',
)({
  placements: Schema.Array(Schema.Struct({
    pieceId: Schema.String,
    position: Schema.Struct({ x: Schema.Number, y: Schema.Number, z: Schema.Number }),
    rotation: Schema.Struct({ x: RotationAngle, y: RotationAngle, z: RotationAngle }),
  })).pipe(
    Schema.filter((arr) => arr.length <= 64, {
      message: () => 'Too many placements',
    }),
  ),
}) {}
```

### 2e. Integrate schemas into `GameModule`

Add `completionSchema` to `GameModule`:

```typescript
export interface GameModule<
  TConfig extends { id: string; difficulty: string } = { id: string; difficulty: string },
  TCompletion = unknown,
> {
  // ... existing fields ...
  readonly completionSchema?: Schema.Schema<TCompletion, unknown>
  readonly validateGameState: (
    level: TConfig,
    completion: TCompletion,
  ) => { completed: boolean; moves: number } | null
}
```

### 2f. Wire schema parsing into pipelines

In `createRecordProgressPipeline`, decode completion through the module's schema:

```typescript
import { ArrayFormatter, Schema } from 'effect'

function parseCompletion<TCompletion>(
  module: GameModule<any, TCompletion>,
  raw: unknown,
) {
  if (!module.completionSchema) return Effect.succeed(raw as TCompletion)

  return Schema.decodeUnknown(module.completionSchema)(raw).pipe(
    Effect.mapError((e) =>
      new GameProgressValidationError({
        reason: ArrayFormatter.formatErrorSync(e)
          .map((issue) => issue.message)
          .join('; '),
      }),
    ),
  )
}
```

Use `ArrayFormatter` (not `TreeFormatter`) for API responses — it returns structured `{ path, message }` arrays instead of human-oriented trees.

### 2g. Remove hand-rolled validators

Once schemas are wired in:
- Delete `parseGameProgressRequest` from `server-handlers.ts`
- Delete `validatePlayerProfileInput` from `profile.validation.ts` (or keep as thin re-export of schema decode)
- Delete `validateGameProgressRequestEffect` and `validatePlayerProfileInputEffect`

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 3: Game Validation and Scoring as Effect Workflows

### 3a. Add `validateAndComputeScore` Effect method to `GameModule`

Each module gets an Effect-first workflow that encapsulates resolve → parse → validate → score:

```typescript
export interface GameModule<TConfig, TCompletion = unknown> {
  // ... existing sync methods stay for client-side use ...

  readonly validateAndComputeScore: (
    levelId: string,
    completion: unknown,
  ) => Effect.Effect<
    {
      completed: boolean
      moves: number
      score: number
      difficulty: string
      isOptimalSolution?: boolean
      wasWinner?: boolean
    },
    GameProgressValidationError
  >
}
```

**Implementation pattern** (same in each module):

```typescript
const validateAndComputeScore = (levelId: string, raw: unknown) =>
  Effect.gen(function* () {
    const level = resolveLevelConfig(levelId)
    if (!level) return yield* new GameProgressValidationError({ reason: `Unknown level: ${levelId}` })

    const parsed = yield* parseCompletion(raw)  // schema decode

    const validation = validateGameState(level, parsed)
    if (validation === null) return yield* new GameProgressValidationError({ reason: 'Invalid game state' })

    const { completed, moves } = validation
    const score = computeScore({ completed, moves })
    const extras = progressExtras?.({ levelId, score, completed, difficulty: level.difficulty }) ?? {}

    return { completed, moves, score, difficulty: level.difficulty, ...extras }
  })
```

### 3b. Simplify `createRecordProgressPipeline`

```typescript
export function createRecordProgressPipeline(module: GameModule, rawData: unknown) {
  return Effect.gen(function* () {
    const data = yield* Schema.decodeUnknown(GameProgressRequest)(rawData).pipe(
      Effect.mapError((e) => new GameProgressValidationError({
        reason: ArrayFormatter.formatErrorSync(e).map((i) => i.message).join('; '),
      })),
    )

    yield* (yield* OriginGuardService).assert()
    yield* (yield* HeaderService).setResponse('cache-control', 'no-store')

    const playerId = yield* (yield* PlayerIdentityService).resolveId()
    yield* (yield* RateLimitService).assert(`record:${module.id}:${playerId}`)

    const result = yield* module.validateAndComputeScore(data.levelId, data.completion)

    return yield* recordGameProgress({
      playerId,
      gameId: module.id,
      levelId: data.levelId,
      ...result,
    })
  })
}
```

### 3c. Keep sync methods on `GameModule`

`validateGameState`, `computeScore`, `resolveLevelConfig` stay as sync methods. They're still useful for client-side validation hints, unit tests of pure game logic, and `getCatalog`/`getDailyPick` flows.

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 4: Test Hardening

### The problem

The current test file has several type-safety holes:

**1. Queue-based mock DB with `unknown[]` and Proxy returning `any`** (`server-workflows.test.ts:637-663`):

```typescript
function createMockDb(resultQueue: unknown[]): DbShape {
  // ...
  function chain(): any {     // ← any return type
    // Proxy returns (..._args: unknown[]) => chain() for every method
  }
  return {
    db: { ... } as unknown as DbShape['db'],  // ← double cast
  }
}
```

This mock doesn't validate that the test is calling the right Drizzle methods. If the production code changes a `.select().from()` chain to `.insert().values()`, the mock silently returns the next queued value regardless. The `as unknown as DbShape['db']` cast hides all mismatches.

**2. Four `as unknown as DbShape['db']` casts** (lines 72, 196, 230, 660) — each is a mock DB that doesn't match the real type.

**3. `as any` cast in `runServerEffect` test** (line 834):

```typescript
runServerEffect(Effect.fail(error) as any)
```

This bypasses the `E extends ServerError` constraint, meaning the test doesn't verify that the error types actually satisfy `ServerError`.

### 4a. Install `@effect/vitest` as direct devDependency

```bash
pnpm add -D @effect/vitest
```

It's already available transitively through alchemy. Making it direct ensures version stability.

### 4b. Switch tests to `@effect/vitest` test runners

Replace the current pattern:

```typescript
// Before — manual Effect.runPromise + rejects.toSatisfy
it('recordGameProgress → ProgressWriteError', async () => {
  await expect(
    Effect.runPromise(
      recordGameProgress({ ... }).pipe(Effect.provide(TestLayer)),
    ),
  ).rejects.toSatisfy((error: unknown) => error instanceof ProgressWriteError)
})
```

With `@effect/vitest`:

```typescript
import { it } from '@effect/vitest'

// After — Effect-native, typed, auto-provides TestContext (includes TestClock)
it.effect('recordGameProgress → ProgressWriteError', () =>
  Effect.gen(function* () {
    const exit = yield* Effect.exit(recordGameProgress({ ... }))
    expect(exit._tag).toBe('Failure')
    if (exit._tag === 'Failure') {
      const error = Cause.failureOption(exit.cause)
      expect(Option.isSome(error)).toBe(true)
      expect(Option.getOrThrow(error)).toBeInstanceOf(ProgressWriteError)
    }
  }).pipe(Effect.provide(TestLayer)),
)

// Or for expected failures:
it.effect.fails('recordGameProgress → ProgressWriteError', () =>
  recordGameProgress({ ... }).pipe(Effect.provide(TestLayer)),
)
```

### 4c. Replace `createMockDb` with typed mock factories

The queue-based Proxy mock is the root cause of the `unknown` / `any` problem. Replace it with mock factories that match the actual query patterns used by production code.

**File**: `src/test/effect-layers.ts`

```typescript
import type { AppDatabase } from '@/db'
import { DbService, type DbShape } from '@/services'
import { Layer } from 'effect'

// Typed result shapes matching what production code actually reads
export interface MockDbResults {
  recordGameProgress?: {
    readBatch: [
      Array<{ achievementId: string }>,       // existing achievements
      Array<{ gameId: string; totalAttempts: number }>,  // attempts by game
    ]
    writeBatch: Array<unknown>  // upsert results (shape varies by achievement count)
    finalRows: Array<{
      playerId: string
      gameId: string
      levelId: string
      bestScore: number
      attempts: number
      completedAt: Date | null
      updatedAt: Date
    }>
  }
  loadDailyChallenge?: {
    existing: Array<{
      challengeDate: string
      gameId: string
      seed: string
      configJson: string
      createdAt: Date
    }>
    inserted?: Array<typeof existing[0]>     // for insert path
    raceWinner?: Array<typeof existing[0]>   // for conflict path
  }
  loadProfile?: {
    player: {
      id: string
      displayName: string
      locale: 'en' | 'vi'
      gradeBand: 'elementary' | 'middle' | 'high'
      createdAt: Date
      updatedAt: Date
    }
    progress: Array<{
      playerId: string
      gameId: string
      levelId: string
      bestScore: number
      attempts: number
      completedAt: Date | null
      updatedAt: Date
    }>
    achievements: Array<{ playerId: string; achievementId: string; unlockedAt: Date }>
  }
  saveProfile?: {
    player: typeof loadProfile['player']
  }
}

// Factory that returns a DbShape whose batch/select/insert calls
// return typed results in sequence, matching the production query order
export function createTypedMockDb(results: MockDbResults): DbShape {
  // Implementation: builds a Drizzle-shaped mock that returns
  // the right result for each query pattern, validated by type
}

// Convenience layers
export function createTestDbLayer(results: MockDbResults) {
  return Layer.succeed(DbService, createTypedMockDb(results))
}
```

**Key difference from `createMockDb`**: Results are keyed by *which workflow* they serve, not by queue position. The mock knows that `recordGameProgress` does a read batch first, then a write batch. Adding or removing a query in production code causes a type error in the mock factory, not a silent test pass.

### 4d. Replace failing DB mock with typed version

```typescript
// Before
function createFailingDb(): DbShape {
  const reject = () => Promise.reject(new Error('D1 binding unavailable'))
  return {
    db: {
      batch: reject,
      select: () => ({ from: () => ({ where: () => ({ ... }) }) }),
      // ...manually chained methods
    } as unknown as DbShape['db'],  // ← cast hides incompleteness
  }
}

// After — typed rejection that matches Drizzle's batch signature
export function createFailingDbLayer(): Layer.Layer<DbShape> {
  return Layer.succeed(DbService, {
    db: createFailingMockDb(),  // implements AppDatabase interface fully
  })
}
```

### 4e. Fix `runServerEffect` test type safety

```typescript
// Before — `as any` bypasses the type constraint
runServerEffect(Effect.fail(error) as any)

// After — use the actual ServerError union type
function expectMappedError<E extends ServerError>(
  error: E,
  expectedMessage: string,
) {
  // Create an effect whose error IS in the ServerError union
  const effect: Effect.Effect<never, E, never> = Effect.fail(error)
  // The AppServices requirement is never, so we can use runtime directly
  return expect(
    runtime.runPromise(
      effect.pipe(Effect.mapError(toUserFacingError)),
    ),
  ).rejects.toThrow(expectedMessage)
}
```

### 4f. Use `it.layer` for shared test layers

```typescript
import { it } from '@effect/vitest'

const SuccessTestLayer = Layer.mergeAll(
  createTestDbLayer({ ... }),
  IdentityLayer,
  PassingGuardLayer,
  PassingRateLimitLayer,
)

it.layer(SuccessTestLayer)('success paths', (it) => {
  it.effect('recordGameProgress succeeds', () =>
    Effect.gen(function* () {
      const result = yield* recordGameProgress({ ... })
      expect(result.playerId).toBe(PLAYER_ID)
      expect(result.bestScore).toBe(100)
    }),
  )
})
```

### 4g. Use `TestClock` for time-dependent tests

```typescript
import { TestClock } from 'effect'

it.effect('rate limiter resets after window', () =>
  Effect.gen(function* () {
    const limiter = yield* RateLimitService
    yield* limiter.assert('key')  // first call OK

    // Advance past the 250ms window
    yield* TestClock.adjust('300 millis')

    // Should succeed again
    yield* limiter.assert('key')
  }).pipe(Effect.provide(TestLayer)),
)
```

### 4h. Typed mock row factories

Replace the loosely-typed mock data objects:

```typescript
// Before — manually typed, can drift from schema
const mockPlayerRow = {
  id: PLAYER_ID,
  displayName: 'Test Player',
  locale: 'en' as const,
  gradeBand: 'elementary' as const,
  createdAt: NOW,
  updatedAt: NOW,
}

// After — derived from Drizzle schema, can't drift
import { schema } from '@/db'

type PlayerRow = typeof schema.players.$inferSelect
type ProgressRow = typeof schema.gameProgress.$inferSelect
type AchievementRow = typeof schema.playerAchievements.$inferSelect
type DailyChallengeRow = typeof schema.dailyChallenges.$inferSelect

function createMockPlayer(overrides?: Partial<PlayerRow>): PlayerRow {
  return {
    id: PLAYER_ID,
    displayName: 'Test Player',
    locale: 'en',
    gradeBand: 'elementary',
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}

function createMockProgress(overrides?: Partial<ProgressRow>): ProgressRow {
  return {
    playerId: PLAYER_ID,
    gameId: 'magic-graph',
    levelId: 'easy_star_3x3',
    bestScore: 100,
    attempts: 1,
    completedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  }
}
```

Now if a column is added to the Drizzle schema, the factory function gets a type error until it handles the new column.

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 5: Shape Architect Solver as Interruptible Effect

### 5a. Create `SolverService`

**File**: `src/services/solver.ts`

```typescript
export interface SolverShape {
  readonly solve: (
    level: LevelConfig,
    options?: { maxTimeMs?: number; algorithm?: 'backtrack' | 'dlx' },
  ) => Effect.Effect<SolverResult, SolverTimeoutError>
}

export const SolverService = Context.Service<SolverShape>('SolverService')
```

**Live implementation** — fork + timeout:

```typescript
import { Duration, Effect, Fiber } from 'effect'

export const SolverServiceLive = Layer.succeed(SolverService, {
  solve: (level, options) =>
    Effect.gen(function* () {
      const maxTimeMs = options?.maxTimeMs ?? 5000
      const solver = options?.algorithm === 'dlx' ? solvePuzzleDLX : solvePuzzle

      const fiber = yield* Effect.fork(
        Effect.sync(() => solver(level, maxTimeMs)),
      )

      const result = yield* Fiber.join(fiber).pipe(
        Effect.timeout(Duration.millis(maxTimeMs + 500)),
        Effect.catchTag('TimeoutException', () =>
          Effect.fail(new SolverTimeoutError({ searchedStates: 0, timeMs: maxTimeMs })),
        ),
      )

      if (result.timedOut) {
        return yield* new SolverTimeoutError({
          searchedStates: result.searchedStates,
          timeMs: result.timeMs,
        })
      }

      return result
    }),
})
```

### 5b. Don't change the client-side solver worker

`useSolverWorker.ts` is React + Web Worker. It stays as-is.

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 6: Lift Services to Full Effect

### 6a. `PlayerIdentityService` as Effect workflow

```typescript
export interface PlayerIdentityShape {
  readonly resolve: () => Effect.Effect<PlayerIdentity>
  readonly resolveId: () => Effect.Effect<string>
}

export const PlayerIdentityServiceLive = Layer.effect(
  PlayerIdentityService,
  Effect.gen(function* () {
    const headers = yield* HeaderService
    const random = yield* RandomService

    return {
      resolve: () =>
        Effect.gen(function* () {
          const cookieHeader = yield* headers.getRequest('cookie')
          const existingId = parsePlayerIdCookie(cookieHeader)

          if (existingId) return createPlayerIdentity(existingId)

          const uuid = yield* random.uuid()
          const playerId = `player_${uuid}`
          const host = yield* headers.getRequest('host')
          yield* headers.setResponse(
            'set-cookie',
            serializePlayerIdCookie(playerId, host ?? undefined),
          )

          return createPlayerIdentity(playerId)
        }),
      resolveId: () =>
        Effect.gen(function* () {
          const identity = yield* resolve()
          return identity.id
        }),
    }
  }),
)
```

### 6b. `OriginGuardService` depends on `HeaderService`

Rewrite the guard as a pure Effect pipeline reading from `HeaderService`. Delete `assertSameOriginPostImpl` — the logic moves into the service.

### 6c. `RateLimitService` depends on `ClockService`

Rewrite to use `ClockService.now()` instead of `Date.now()`. The in-memory `Map<string, number>` throttle stays — it's correctly scoped to one isolate.

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 7: Daily Challenge + Profile Improvements

### 7a. Remove the `date` parameter from `loadDailyChallenge`

```typescript
export function loadDailyChallenge() {
  return Effect.gen(function* () {
    const { db } = yield* DbService
    const dateKey = yield* (yield* ClockService).dateKey()
    // ... rest unchanged ...
  })
}
```

### 7b. Batch reads in `loadPlayerProfileOverview`

Combine the three sequential queries into one `db.batch()`:

```typescript
const [player, progress, achievements] = yield* withD1Retry(
  Effect.tryPromise({
    try: () =>
      db.batch([
        db.select().from(schema.players).where(eq(schema.players.id, identity.id)).limit(1),
        db.select().from(schema.gameProgress).where(eq(schema.gameProgress.playerId, identity.id))
          .orderBy(asc(schema.gameProgress.gameId), asc(schema.gameProgress.levelId)),
        db.select().from(schema.playerAchievements).where(eq(schema.playerAchievements.playerId, identity.id))
          .orderBy(asc(schema.playerAchievements.achievementId)),
      ] as const),
    catch: (cause) => new PlayerProfileError({ cause }),
  }),
)
```

### 7c. `planDailyChallenge` stays pure

No change — it takes a `dateKey` string and returns a `PlannedDailyChallenge`.

**Verify**: `pnpm typecheck && pnpm test`

---

## Phase 8: Comprehensive Tests

### 8a. Shared test infrastructure

**File**: `src/test/effect-layers.ts`

```typescript
import type { AppDatabase } from '@/db'
import { schema } from '@/db'

// Row types derived from Drizzle schema — can't drift
type PlayerRow = typeof schema.players.$inferSelect
type ProgressRow = typeof schema.gameProgress.$inferSelect
type AchievementRow = typeof schema.playerAchievements.$inferSelect
type DailyChallengeRow = typeof schema.dailyChallenges.$inferSelect

// Mock row factories
export function mockPlayer(overrides?: Partial<PlayerRow>): PlayerRow
export function mockProgress(overrides?: Partial<ProgressRow>): ProgressRow
export function mockAchievement(overrides?: Partial<AchievementRow>): AchievementRow
export function mockDailyChallenge(overrides?: Partial<DailyChallengeRow>): DailyChallengeRow

// Service test layers
export function createTestClock(fixed: Date): Layer.Layer<ClockShape>
export function createTestRandom(uuids: string[]): Layer.Layer<RandomShape>
export function createTestHeaders(req: Record<string, string>): Layer.Layer<HeaderShape>
export function createTestDbLayer(results: MockDbResults): Layer.Layer<DbShape>
export function createFailingDbLayer(): Layer.Layer<DbShape>
export function createPassingIdentityLayer(id?: string): Layer.Layer<PlayerIdentityShape>
export function createPassingGuardLayer(): Layer.Layer<OriginGuardShape>
export function createBlockingGuardLayer(): Layer.Layer<OriginGuardShape>
export function createPassingRateLimitLayer(): Layer.Layer<RateLimitShape>
export function createBlockingRateLimitLayer(): Layer.Layer<RateLimitShape>
```

### 8b. Test categories

**Schema validation tests** (new file: `src/effect/__tests__/schema.test.ts`):
- `GameProgressRequest rejects missing levelId`
- `GameProgressRequest rejects null completion`
- `PlayerProfileInput normalizes whitespace in displayName`
- `PlayerProfileInput rejects 1-char displayName`
- `PlayerProfileInput rejects invalid locale`
- `MagicGraphCompletion rejects non-object nodeValues`
- `ShapeArchitectCompletion rejects invalid rotation angles`
- `ShapeArchitectCompletion rejects oversized placements`

**Service isolation tests** (new file: `src/effect/__tests__/services.test.ts`):
- `ClockService.dateKey returns UTC date`
- `HeaderService reads/writes through test layer`
- `OriginGuardService rejects cross-origin via HeaderService`
- `OriginGuardService accepts same-origin via HeaderService`
- `RateLimitService rejects within window`
- `RateLimitService allows after window (via TestClock)`
- `PlayerIdentityService creates new player via RandomService`
- `PlayerIdentityService reuses existing cookie via HeaderService`
- `PlayerIdentityService sets cookie on new player via HeaderService`

**Error boundary tests** (in `server-workflows.test.ts`):
- All existing tests, rewritten with `@effect/vitest` and typed mocks
- New: `runServerEffect maps ParseError from Schema validation`
- New: `SolverTimeoutError maps to user-facing message`
- New: `runServerEffect logs error before mapping` (verify log side-effect)

**Full pipeline integration tests** (in `server-workflows.test.ts`):
- All existing success-path tests, rewritten with typed mock row factories
- New: `recordGameProgress unlocks achievements on first completion`
- New: `createRecordProgressPipeline rejects when schema parsing fails`
- New: `createUpdateProfilePipeline round-trip (save → load)`

### 8c. Config-driven tests

Use `ConfigProvider.fromMap` to test edge cases:

```typescript
it.effect('rate limiter uses configured window', () =>
  Effect.gen(function* () {
    // ... test with custom RATE_LIMIT_WINDOW_MS ...
  }).pipe(
    Effect.withConfigProvider(
      ConfigProvider.fromMap(new Map([['RATE_LIMIT_WINDOW_MS', '1000']])),
    ),
    Effect.provide(TestLayer),
  ),
)
```

**Verify**: `pnpm test` — all new tests green

---

## What stays plain TypeScript (never Effect)

| Code | Why |
|------|-----|
| React components, hooks, routes | UI concern, Effect adds nothing |
| `useSolverWorker.ts` | React state + Web Worker lifecycle |
| Drizzle schema definitions (`src/db/schema.ts`) | Static declarations |
| `GameModule` sync methods (`validateGameState`, `computeScore`, `getCatalog`, `getDailyPick`, `evaluateAchievements`) | Pure logic, called by Effect programs but not Effect themselves |
| `checkAchievements` | Pure decision function, no IO |
| `planDailyChallenge`, `getUtcDateKey`, `parseDailyChallengeConfig` | Pure data transforms |
| `parsePlayerIdCookie`, `serializePlayerIdCookie`, `createPlayerIdentity` | Pure string/object helpers |
| All game logic kernels (solvers, generators, engines, validators) | Deterministic math |
| `alchemy.run.ts` | Already uses Effect independently for IaC |

---

## Anti-patterns to enforce

1. **No `Effect.sync(() => pureFunction())`** — if a function is pure and infallible, call it directly inside `Effect.gen`
2. **No exported Effect APIs with zero callers** — every Effect function must have at least one caller in production code
3. **No `Effect.runPromise` except through `ManagedRuntime` in `runServerEffect`** — single boundary point
4. **No `throw` inside Effect programs** — use `Effect.fail` or `yield* new TaggedError(...)`
5. **No `Date.now()` or `new Date()` in Effect programs** — use `ClockService`
6. **No `crypto.randomUUID()` in Effect programs** — use `RandomService`
7. **No `getRequestHeader` / `setResponseHeader` in Effect programs** — use `HeaderService`
8. **No `as unknown as DbShape['db']` in tests** — use typed mock factories derived from Drizzle schema types
9. **No `as any` to bypass Effect type constraints in tests** — if a test can't satisfy the types, the test is wrong
10. **No `resultQueue: unknown[]` mock patterns** — mock results must be keyed by workflow and typed by row shape

---

## Execution order

```
Phase 0  (ManagedRuntime + retry)  → pnpm typecheck + test
Phase 1  (Service layer)           → pnpm typecheck + test
Phase 2  (Branded types + Schema)  → pnpm typecheck + test
Phase 3  (Game workflows)          → pnpm typecheck + test
Phase 4  (Test hardening)          → pnpm test (all rewritten)
Phase 5  (Solver service)          → pnpm typecheck + test
Phase 6  (Service lift)            → pnpm typecheck + test
Phase 7  (Daily + profile)         → pnpm typecheck + test
Phase 8  (Comprehensive tests)     → pnpm test (full coverage)
Final:   pnpm check                → full CI suite
```

Phases 0-4 are the highest value — they establish the runtime, type safety, and test quality foundation. Phases 5-7 are incremental improvements. Phase 8 fills gaps.

---

## Effect features used (with rationale)

| Feature | Where | Why |
|---------|-------|-----|
| `ManagedRuntime` | `runServerEffect` | Build layer graph once per isolate, not per request |
| `Match.exhaustive` | `toUserFacingError` | Compile-time exhaustiveness on error union |
| `Schedule` + `Effect.retry` | All `Effect.tryPromise` DB calls | D1 transient failure resilience |
| `Schema.Class` | Request/completion schemas | Validated construction + `decodeUnknown` |
| `Schema.brand` | `PlayerId`, `GameId`, `LevelId` | Nominal types, zero runtime cost |
| `Schema.transform` | `DisplayName` | Normalize input during parsing |
| `Schema.filter` | Completion schemas | Structural constraints |
| `ArrayFormatter` | Schema error mapping | Structured API error messages |
| `Config` | `AppConfig` | Typed env vars with defaults |
| `ConfigProvider.fromMap` | Tests | Override config without env vars |
| `@effect/vitest` | All tests | `it.effect`, `it.layer`, `it.effect.fails` |
| `TestClock` | Rate limiter tests | Deterministic time control |
| `Layer.effect` + `Layer.provide` | Service composition | Inter-service dependencies |
| `Effect.log` | `runServerEffect` | Structured error logging |
| `Fiber.join` + `Effect.timeout` | `SolverService` | Interruptible solver |

### Features evaluated and deferred

| Feature | Why deferred |
|---------|-------------|
| `Effect.request` / `RequestResolver` | Current read patterns are simple enough for `db.batch()`. Worth revisiting if read-heavy routes multiply. |
| `Layer.scoped` | D1 bindings don't need lifecycle management. Revisit if adding pooled resources. |
| `FiberRef` | Per-request context (request ID, player ID) doesn't need fiber-local storage yet. Revisit for structured logging. |
| `Schema.TaggedStruct` | No domain events beyond `Data.TaggedError`. Revisit when adding game events. |

---

## File inventory

| File | Action | Phase |
|------|--------|-------|
| `src/services/run-server-effect.ts` | UPDATE — ManagedRuntime, Match.exhaustive, logging | 0 |
| `src/services/retry.ts` | **NEW** — d1RetryPolicy | 0c |
| `src/services/clock.ts` | **NEW** | 1a |
| `src/services/random.ts` | **NEW** | 1b |
| `src/services/headers.ts` | **NEW** | 1c |
| `src/services/worker-env.ts` | **NEW** | 1d |
| `src/services/config.ts` | **NEW** | 1e |
| `src/services/app-layer.ts` | UPDATE — add new services, wire dependencies | 1g |
| `src/services/index.ts` | UPDATE — re-export new services | 0-1 |
| `src/services/db.ts` | UPDATE — depend on WorkerEnvService | 1d |
| `src/services/branded.ts` | **NEW** — PlayerId, GameId, LevelId | 2a |
| `src/games/game-progress.schema.ts` | **NEW** | 2b |
| `src/player/profile.schema.ts` | **NEW** | 2c |
| `src/games/MagicGraph/magic-graph.schema.ts` | **NEW** | 2d |
| `src/games/SequenceRace/sequence-race.schema.ts` | **NEW** | 2d |
| `src/games/ShapeArchitect/shape-architect.schema.ts` | **NEW** | 2d |
| `src/games/game-module.ts` | UPDATE — add completionSchema, validateAndComputeScore | 2e, 3a |
| `src/games/MagicGraph/module.ts` | UPDATE — add schema + Effect workflow | 2d, 3a |
| `src/games/SequenceRace/module.ts` | UPDATE — add schema + Effect workflow | 2d, 3a |
| `src/games/ShapeArchitect/module.ts` | UPDATE — add schema + Effect workflow | 2d, 3a |
| `src/games/server-handlers.ts` | UPDATE — use schemas, module.validateAndComputeScore, HeaderService | 2f, 3b |
| `src/player/profile.validation.ts` | DELETE or thin re-export of schema | 2g |
| `src/test/effect-layers.ts` | **NEW** — typed mock factories, test layers | 4 |
| `src/effect/__tests__/server-workflows.test.ts` | REWRITE — @effect/vitest, typed mocks, no `as any` | 4 |
| `src/effect/__tests__/schema.test.ts` | **NEW** | 8b |
| `src/effect/__tests__/services.test.ts` | **NEW** | 8b |
| `src/services/solver.ts` | **NEW** | 5a |
| `src/services/player-identity.ts` | UPDATE — Effect workflow, depend on HeaderService + RandomService | 6a |
| `src/services/origin-guard.ts` | UPDATE — depend on HeaderService | 6b |
| `src/services/rate-limit.ts` | UPDATE — depend on ClockService | 6c |
| `src/daily/daily.server.ts` | UPDATE — use ClockService | 7a |
| `src/player/profile.server.ts` | UPDATE — batch queries, withD1Retry | 7b |
| `src/player/profile.functions.ts` | UPDATE — remove bare setResponseHeader | 1c |
| `src/daily/daily.functions.ts` | UPDATE — remove bare setResponseHeader | 1c |
| `src/games/progress/progress.server.ts` | UPDATE — withD1Retry | 0c |
| `src/services/errors.ts` | UNCHANGED after current plan | — |
