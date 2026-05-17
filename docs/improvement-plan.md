# Math Games: Detailed Improvement Plan

Based on `next-phase.md`, grounded in the current architecture. Every addition follows the existing Effect service pattern, GameModule contract, and Drizzle/D1 schema conventions.

---

## Prerequisite: Architecture Tightening

These changes reduce friction for everything that follows. Do them before adding games or features.

### P0. Derive GameId from the Registry

**Problem**: Adding a game today means editing the `GameId` union, `GameRoute` union, schema enum literals in `gameId` columns, `dailyGameRotation`, translations, achievements, and route/theme maps. That's 8+ touch points.

**Solution**: Make the registry the single source of truth.

```
src/games/registry.ts
```

```typescript
export const GAME_MODULES = [
  magicGraphModule,
  sequenceRaceModule,
  shapeArchitectModule,
] as const;

export type GameId = (typeof GAME_MODULES)[number]["id"];
export type GameRoute = (typeof GAME_MODULES)[number]["route"];

export const GAME_IDS = GAME_MODULES.map((m) => m.id);
export const registry = Object.fromEntries(
  GAME_MODULES.map((m) => [m.id, m]),
) as { [K in GameId]: Extract<(typeof GAME_MODULES)[number], { id: K }> };

export const dailyGameRotation: readonly GameId[] = GAME_MODULES.map(
  (m) => m.id,
);
```

**SOLID**: Open/Closed — adding a game means importing the module and appending to `GAME_MODULES`. No union edits, no schema enum edits (D1 `text` columns already accept any string; the type constraint lives in TypeScript).

**Schema impact**: Change `gameId` columns from `text('game_id', { enum: [...] })` to plain `text('game_id')`. The TypeScript type system enforces correctness; D1 has no enum enforcement anyway.

**Downstream**: `GameModule.id` becomes the canonical token. Translations, achievements, themes, and route metadata should be co-located in each module (see P2).

---

### P1. Co-locate Translations per Game Module

**Problem**: `translations.ts` is a 450+ key monolith. Adding a game means adding keys to a shared file that every other game also touches.

**Solution**: Each `GameModule` exports its own translation fragment. A merge function builds the full map at startup.

```
src/i18n/
  core.ts              # App-wide keys (nav, profile, ranks, common UI)
  types.ts             # Locale, TranslationKey, t(), tx()
  merge.ts             # mergeTranslations(...fragments): FullTranslationMap
src/games/MagicGraph/
  translations.ts      # { en: { 'mg.title': ..., 'mg.achievement.first_solve': ... }, vi: { ... } }
```

Extend `GameModule`:

```typescript
interface GameModule<TConfig> {
  // ... existing fields
  readonly translations: {
    en: Record<string, string>;
    vi: Record<string, string>;
  };
}
```

**SOLID**: Single Responsibility — each game owns its strings. Interface Segregation — the core i18n module doesn't know about game-specific keys.

**Completeness test**: A Vitest test iterates all modules, asserts `Object.keys(m.translations.en)` equals `Object.keys(m.translations.vi)`.

---

### P2. Co-locate Achievements per Game Module (already done, formalize)

Achievements are already defined per-module. Formalize by making the `GameModule.achievements` array the only place game-specific achievements live. Global achievements stay in `achievements.logic.ts`. The `checkAchievements` function collects them:

```typescript
const allAchievements = [
  ...GLOBAL_ACHIEVEMENTS,
  ...GAME_MODULES.flatMap((m) => m.achievements),
];
```

---

### P3. Game Scaffolding Script

A `pnpm create:game <name>` script (a simple Node script in `scripts/create-game.ts`) that:

1. Creates `src/games/<PascalName>/` with `module.ts`, `logic.ts`, `<kebab>.catalog.ts`, `<kebab>.schema.ts`, `<kebab>.functions.ts`, `translations.ts`, `__tests__/`.
2. Creates `src/routes/games/<kebab>.tsx`.
3. Appends the import to `registry.ts`'s `GAME_MODULES` array.
4. Prints a checklist of manual steps (add route link in nav, write catalog entries).

This is a convenience tool, not a framework. It generates files from string templates.

---

## Phase 1: Polish the Current Experience

### 1.1 Daily Player Results & Streaks

**New table**: `daily_player_results`

```typescript
// src/db/schema.ts
export const dailyPlayerResults = sqliteTable(
  "daily_player_results",
  {
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    challengeDate: text("challenge_date").notNull(),
    gameId: text("game_id").notNull(),
    levelId: text("level_id").notNull(),
    score: integer("score").notNull().default(0),
    completed: integer("completed", { mode: "boolean" })
      .notNull()
      .default(false),
    attempts: integer("attempts").notNull().default(0),
    completedAt: integer("completed_at", { mode: "timestamp" }),
  },
  (table) => [primaryKey({ columns: [table.playerId, table.challengeDate] })],
);
```

**New service**: `DailyStreakService`

```
src/services/daily-streak.ts
```

```typescript
interface DailyStreakShape {
  recordDailyCompletion(input: {
    playerId: string;
    challengeDate: string;
    gameId: GameId;
    levelId: string;
    score: number;
    completed: boolean;
  }): Effect.Effect<DailyCompletionResult, ServerError>;

  getStreak(playerId: string): Effect.Effect<StreakInfo, ServerError>;

  getCalendar(
    playerId: string,
    month: string,
  ): Effect.Effect<DailyCalendarEntry[], ServerError>;
}

interface StreakInfo {
  current: number;
  longest: number;
  completedToday: boolean;
  lastCompletedDate: string | null;
}

interface DailyCalendarEntry {
  date: string;
  gameId: GameId;
  score: number;
  completed: boolean;
}
```

**Implementation** (`DailyStreakServiceLive`):

- `recordDailyCompletion`: UPSERT into `daily_player_results`. If `completed` flips from false to true, check streak continuity (yesterday's row exists and is completed).
- `getStreak`: Walk backwards from today through `daily_player_results` rows ordered by `challengeDate DESC`. Count consecutive completed days. Also query `MAX` consecutive run for `longest`.
- `getCalendar`: `SELECT * FROM daily_player_results WHERE playerId = ? AND challengeDate LIKE '2026-05-%' ORDER BY challengeDate`.

**Layer integration**: Add `DailyStreakServiceLive` to `ServiceLayer` in `app-layer.ts`. It depends on `DbService` and `ClockService`.

**Pipeline change**: After `recordGameProgress` succeeds in the daily challenge flow, call `DailyStreakService.recordDailyCompletion`. The daily route's server function already knows if the current game is a daily challenge (it loads from `dailyChallenges` table).

**Achievement unlock**: `global_streak_30` can now evaluate against real streak data. Add `streak: number` to `AchievementContext` (it's already defined there but currently unpopulated). The `recordDailyCompletion` return value includes the new streak count, which feeds into `checkAchievements`.

**SOLID**: Single Responsibility — streak logic is isolated from game progress. Dependency Inversion — the pipeline depends on the `DailyStreakService` interface, not the implementation.

---

### 1.2 Richer Post-Attempt Feedback

**Problem**: `validateGameState` returns `{ completed: boolean; moves: number } | null`. A `null` means "invalid state" but gives no diagnostic. A `completed: false` gives no explanation of what went wrong.

**Solution**: Extend the validation return type with an optional `feedback` field.

```typescript
interface ValidationResult {
  completed: boolean;
  moves: number;
  feedback?: GameFeedback;
}

type GameFeedback =
  | { kind: "wrong-line"; lineIndex: number; actual: number; target: number } // Magic Graph
  | { kind: "ai-forced-win"; finalMove: number } // Sequence Race
  | { kind: "collision"; pieceId: string; collidingWith: string } // Shape Architect
  | { kind: "out-of-bounds"; pieceId: string } // Shape Architect
  | { kind: "generic"; message: string }; // Fallback
```

Each game's `validateGameState` already inspects the board/state to determine correctness. Adding a `feedback` field is a localized change to each game's logic — the validator already has the context.

**Wire-through**: `validateAndComputeScore` passes `feedback` through to the response. The client renders it in a dismissable card below the game board.

**SOLID**: Open/Closed — each game defines its own `GameFeedback` variant without modifying others. Liskov — the `feedback` field is optional; existing callers that ignore it still work.

---

### 1.3 Achievement & Rank-Up Toasts

**Current state**: `recordGameProgress` returns `newAchievements: string[]` and the client has access to the player's rank progression.

**Change**: Extend the progress response to include rank transition info.

```typescript
interface GameProgressResponse {
  saved: boolean;
  newBestScore: boolean;
  previousBest: number | null;
  newAchievements: AchievementInfo[]; // Was string[], now includes name + rarity + bilingual strings
  rankUp: { from: string; to: string } | null;
  feedback?: GameFeedback;
}

interface AchievementInfo {
  id: string;
  name: string;
  localizedName: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}
```

**Server change**: `recordGameProgress` already queries existing achievements and computes new ones. Before returning, compute the player's rank before and after. If it changed, include `rankUp`. Populate `AchievementInfo` from the module's achievement definitions + translations.

**Client**: A toast queue renders achievement cards and rank-up animations. This is purely a UI component — no new services needed.

---

### 1.4 Resume & Recommended Next Level

**New server function**: `getPlayerGameState`

```typescript
export const getPlayerGameState = createServerFn({ method: "GET" }).handler(
  () =>
    runServerEffect(
      Effect.gen(function* () {
        const playerId = yield* PlayerIdentityService.resolveId();
        const progress = yield* DbService.pipe(
          Effect.flatMap((db) =>
            Effect.tryPromise(() =>
              db.db
                .select()
                .from(gameProgress)
                .where(eq(gameProgress.playerId, playerId))
                .all(),
            ),
          ),
        );
        // Group by gameId, find highest completed level, suggest next
        return computeRecommendations(progress);
      }),
    ),
);
```

**Logic** (`computeRecommendations`): For each game, find the highest-difficulty completed level. Recommend the next uncompleted level at the same difficulty, or the first level at the next difficulty. This is pure logic operating on the progress rows and the module catalogs.

**SOLID**: Single Responsibility — recommendation logic is a pure function, not mixed into the progress write path.

---

### 1.5 Translation Completeness Test

```
src/i18n/__tests__/completeness.test.ts
```

```typescript
import { GAME_MODULES } from "@/games/registry";
import { coreTranslations } from "@/i18n/core";

test("every English key has a Vietnamese counterpart", () => {
  // Core translations
  const enKeys = Object.keys(coreTranslations.en).sort();
  const viKeys = Object.keys(coreTranslations.vi).sort();
  expect(viKeys).toEqual(enKeys);

  // Per-game translations
  for (const mod of GAME_MODULES) {
    const gameEn = Object.keys(mod.translations.en).sort();
    const gameVi = Object.keys(mod.translations.vi).sort();
    expect(gameVi).toEqual(gameEn);
  }
});
```

---

## Phase 2: Pattern Detective (Fourth Game)

### Why First

Pattern Detective is the lowest-risk fourth game. It reuses sequence-generation ideas from Sequence Race, has a trivial completion payload (`{ selectedAnswer: number | string }`), and server validation is a single equality check.

### Module Structure

```
src/games/PatternDetective/
  module.ts                        # GameModule<PatternConfig> implementation
  logic.ts                         # Pattern generation, answer validation
  pattern-detective.catalog.ts     # Level definitions by difficulty
  pattern-detective.schema.ts      # PatternDetectiveCompletion schema
  pattern-detective.functions.ts   # Server functions
  translations.ts                  # en/vi strings
  __tests__/
    logic.test.ts
    validation.test.ts
```

### Types

```typescript
// pattern-detective.catalog.ts
interface PatternConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  patternType:
    | "arithmetic"
    | "geometric"
    | "fibonacci-like"
    | "prime"
    | "custom";
  sequence: readonly number[];
  missingIndex: number;
  answer: number;
  distractors: readonly number[];
  hint?: string;
}
```

### Completion Schema

```typescript
// pattern-detective.schema.ts
class PatternDetectiveCompletion extends Schema.Class<PatternDetectiveCompletion>(
  "PatternDetectiveCompletion",
)({
  selectedAnswer: Schema.Union(Schema.Number, Schema.String),
}) {}
```

### Module Implementation

```typescript
// module.ts
export const patternDetectiveModule: GameModule<PatternConfig> = {
  id: "pattern-detective",
  route: "/games/pattern-detective",
  title: "Pattern Detective",
  description: "Find the missing number in the sequence",
  difficulties: ["easy", "medium", "hard"],
  achievements: [
    {
      id: "pd_first_pattern",
      category: "pattern-detective",
      name: "Pattern Spotter",
      rarity: "common",
    },
    {
      id: "pd_hard_streak",
      category: "pattern-detective",
      name: "Master Detective",
      rarity: "epic",
    },
  ],
  levelCount: catalog.length,
  translations: patternDetectiveTranslations,

  getCatalog: () => catalog,
  getDailyPick: (hash) => {
    const level = catalog[hash % catalog.length];
    return { levelId: level.id, title: level.id, difficulty: level.difficulty };
  },

  resolveLevelConfig: (levelId) =>
    catalog.find((c) => c.id === levelId) ?? null,

  validateGameState: (level, raw) => {
    const parsed = Schema.decodeUnknownOption(PatternDetectiveCompletionSchema)(
      raw,
    );
    if (Option.isNone(parsed)) return null;
    const correct = parsed.value.selectedAnswer === level.answer;
    return { completed: correct, moves: 1 };
  },

  computeScore: ({ completed, moves }) => (completed ? 100 : 0),

  evaluateAchievements: (ctx, unlocked) => {
    const newly: string[] = [];
    if (ctx.completed && !unlocked.has("pd_first_pattern"))
      newly.push("pd_first_pattern");
    if (
      ctx.completed &&
      ctx.difficulty === "hard" &&
      !unlocked.has("pd_hard_streak")
    )
      newly.push("pd_hard_streak");
    return newly;
  },

  validateAndComputeScore: (levelId, raw) =>
    Effect.gen(function* () {
      const level = patternDetectiveModule.resolveLevelConfig(levelId);
      if (!level)
        return yield* new GameProgressValidationError({
          reason: `Unknown level: ${levelId}`,
        });

      const parsed = yield* Effect.try({
        try: () =>
          Schema.decodeUnknownSync(PatternDetectiveCompletionSchema)(raw),
        catch: () =>
          new GameProgressValidationError({
            reason: "Invalid completion payload",
          }),
      });

      const completed = parsed.selectedAnswer === level.answer;
      return {
        completed,
        moves: 1,
        score: completed ? 100 : 0,
        difficulty: level.difficulty,
      };
    }),
};
```

### Registration

```typescript
// registry.ts — single change
export const GAME_MODULES = [
  magicGraphModule,
  sequenceRaceModule,
  shapeArchitectModule,
  patternDetectiveModule, // append
] as const;
```

### Route

```
src/routes/games/pattern-detective.tsx
```

Standard TanStack route. Loads level via `getPatternDetectiveLevel`, renders sequence with a blank slot, shows multiple-choice answers (the correct answer + distractors shuffled), submits via `recordPatternDetectiveProgress`.

**SOLID throughout**:

- **Open/Closed**: No existing game module is modified. The registry array grows by one element.
- **Liskov**: `patternDetectiveModule` satisfies `GameModule<PatternConfig>` — all existing pipelines (`createRecordProgressPipeline`, `createGetCatalogHandler`) work without change.
- **Interface Segregation**: The module only implements what `GameModule` requires. Pattern-specific logic stays in `logic.ts`.
- **Dependency Inversion**: Server functions depend on `AppServices` (Effect context), not concrete implementations.

---

## Phase 3: Full-Stack Extensions

### 3.1 Game Attempts (Append-Only History)

**New table**: `game_attempts`

```typescript
export const gameAttempts = sqliteTable("game_attempts", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  gameId: text("game_id").notNull(),
  levelId: text("level_id").notNull(),
  score: integer("score").notNull(),
  completed: integer("completed", { mode: "boolean" }).notNull(),
  moves: integer("moves").notNull(),
  durationMs: integer("duration_ms"),
  mode: text("mode", { enum: ["practice", "daily"] })
    .notNull()
    .default("practice"),
  completionJson: text("completion_json"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

**Relationship to `game_progress`**: `game_progress` remains the rollup (best score, total attempts, last completed). `game_attempts` is the raw log. On every progress save, also insert into `game_attempts`.

**New service**: `GameAttemptsService`

```typescript
interface GameAttemptsShape {
  record(input: AttemptInput): Effect.Effect<void, ServerError>;
  getHistory(
    playerId: string,
    gameId: GameId,
    levelId: string,
  ): Effect.Effect<Attempt[], ServerError>;
  getStats(
    playerId: string,
    gameId: GameId,
  ): Effect.Effect<GameStats, ServerError>;
}

interface GameStats {
  totalAttempts: number;
  completionRate: number;
  averageScore: number;
  averageMoves: number;
  bestScoreByLevel: Record<string, number>;
}
```

**Pipeline integration**: In `recordGameProgress`, after the UPSERT to `game_progress`, call `GameAttemptsService.record`. Both writes happen in the same `db.batch([...])` call for atomicity.

**SOLID**: Single Responsibility — attempts are a separate concern from progress rollups. The rollup table serves fast reads (profile, leaderboards); the attempts table serves analytics and history.

---

### 3.2 Classroom System

This is the largest addition. It introduces three new tables and two new services.

**New tables**:

```typescript
export const classrooms = sqliteTable("classrooms", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  teacherPlayerId: text("teacher_player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  joinCode: text("join_code").notNull().unique(),
  gradeBand: text("grade_band", { enum: ["elementary", "middle", "high"] }),
  locale: text("locale", { enum: ["en", "vi"] }).default("en"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});

export const classroomMembers = sqliteTable(
  "classroom_members",
  {
    classroomId: text("classroom_id")
      .notNull()
      .references(() => classrooms.id, { onDelete: "cascade" }),
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["student", "teacher"] })
      .notNull()
      .default("student"),
    joinedAt: integer("joined_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.classroomId, table.playerId] })],
);

export const assignments = sqliteTable("assignments", {
  id: text("id").primaryKey(),
  classroomId: text("classroom_id")
    .notNull()
    .references(() => classrooms.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  gameId: text("game_id").notNull(),
  levelIds: text("level_ids").notNull(), // JSON array of level IDs
  dueDate: text("due_date"), // ISO date string
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

**New services**:

```typescript
// src/services/classroom.ts
interface ClassroomShape {
  create(input: {
    name: string;
    gradeBand?: string;
    locale?: string;
  }): Effect.Effect<Classroom, ServerError>;
  join(joinCode: string): Effect.Effect<ClassroomMembership, ServerError>;
  getMyClassrooms(): Effect.Effect<ClassroomSummary[], ServerError>;
  getMembers(
    classroomId: string,
  ): Effect.Effect<MemberWithProgress[], ServerError>;
  getStudentProgress(
    classroomId: string,
  ): Effect.Effect<ClassroomProgressReport, ServerError>;
}

// src/services/assignment.ts
interface AssignmentShape {
  create(input: {
    classroomId: string;
    title: string;
    gameId: GameId;
    levelIds: string[];
    dueDate?: string;
  }): Effect.Effect<Assignment, ServerError>;
  getForClassroom(
    classroomId: string,
  ): Effect.Effect<AssignmentWithProgress[], ServerError>;
  getForStudent(
    playerId: string,
  ): Effect.Effect<StudentAssignment[], ServerError>;
}
```

**Authorization model**: The current cookie-based identity stays as-is. A "teacher" is simply a player who created a classroom. Students join via code. No passwords, no OAuth — the identity cookie is the auth token.

The `ClassroomService` methods that read/write classroom data check that the requesting player is a member (for reads) or the teacher (for writes). This is an authorization guard inside the Effect pipeline:

```typescript
const assertTeacher = (classroomId: string) =>
  Effect.gen(function* () {
    const playerId = yield* PlayerIdentityService.resolveId()
    const membership = yield* // query classroomMembers
    if (!membership || membership.role !== 'teacher')
      return yield* new AuthorizationError({ reason: 'Not a teacher of this classroom' })
  })
```

**Routes**:

- `/classroom` — list my classrooms, join form
- `/classroom/[id]` — teacher dashboard (member list, assignment list, progress grid)
- `/classroom/[id]/assign` — create assignment form

**SOLID**:

- **Single Responsibility**: `ClassroomService` handles membership. `AssignmentService` handles assignments. Progress data comes from the existing `DbService` queries.
- **Open/Closed**: The existing game progress pipeline doesn't change. The classroom dashboard reads from `game_progress` and `game_attempts` using existing data.
- **Dependency Inversion**: Dashboard queries depend on `DbService` and `GameAttemptsService` interfaces, not direct SQL.

---

### 3.3 Account Linking (Optional)

**New table**: `account_links`

```typescript
export const accountLinks = sqliteTable("account_links", {
  playerId: text("player_id")
    .primaryKey()
    .references(() => players.id, { onDelete: "cascade" }),
  email: text("email").notNull().unique(),
  magicLinkToken: text("magic_link_token"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  linkedAt: integer("linked_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`),
});
```

**New service**: `AccountLinkService`

```typescript
interface AccountLinkShape {
  requestLink(email: string): Effect.Effect<void, ServerError>;
  verifyLink(token: string): Effect.Effect<{ playerId: string }, ServerError>;
  resolveByEmail(email: string): Effect.Effect<string | null, ServerError>;
}
```

**Flow**: Player enters email → server generates a magic link token, stores it in `account_links`, sends email (via Cloudflare Email Workers or a simple Resend/Mailgun integration). Player clicks link → server verifies token, sets the `mg_player` cookie to the linked `playerId`. This preserves progress across devices.

**SOLID**: Single Responsibility — account linking is its own service. The existing `PlayerIdentityService` doesn't change; it still resolves from the cookie. The magic link flow just sets the same cookie after verification.

---

### 3.4 Scoped Leaderboards

**New table**: `leaderboard_entries`

```typescript
export const leaderboardEntries = sqliteTable(
  "leaderboard_entries",
  {
    playerId: text("player_id")
      .notNull()
      .references(() => players.id, { onDelete: "cascade" }),
    gameId: text("game_id").notNull(),
    levelId: text("level_id").notNull(),
    scope: text("scope").notNull(), // 'personal' | classroom ID
    score: integer("score").notNull(),
    moves: integer("moves").notNull(),
    achievedAt: integer("achieved_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    primaryKey({
      columns: [table.playerId, table.gameId, table.levelId, table.scope],
    }),
  ],
);
```

**Scope types**:

- `personal` — always written on new best score
- Classroom ID — written when the player is a member of that classroom

**New service**: `LeaderboardService`

```typescript
interface LeaderboardShape {
  recordEntry(input: LeaderboardInput): Effect.Effect<void, ServerError>;
  getPersonalBests(
    playerId: string,
    gameId: GameId,
  ): Effect.Effect<LeaderboardEntry[], ServerError>;
  getClassroomLeaderboard(
    classroomId: string,
    gameId: GameId,
    levelId: string,
  ): Effect.Effect<LeaderboardEntry[], ServerError>;
}
```

**Pipeline integration**: After `recordGameProgress` detects a new best score, call `LeaderboardService.recordEntry` for `personal` scope and for each classroom the player belongs to.

**SOLID**: Open/Closed — new scope types (e.g., `daily-anonymous`) can be added without modifying existing logic. The `scope` field is a plain string, not an enum.

---

### 3.5 Analytics Dashboard

**Current state**: `AnalyticsService` already writes events to Cloudflare Analytics Engine (game completions, achievements, daily attempts).

**New route**: `/admin/analytics`

This is a read-only route that queries Analytics Engine via the Cloudflare API. No new D1 tables needed.

**New service**: `AnalyticsDashboardService`

```typescript
interface AnalyticsDashboardShape {
  getCompletionRates(
    dateRange: DateRange,
  ): Effect.Effect<CompletionRateReport, ServerError>;
  getLevelDifficulty(
    gameId: GameId,
  ): Effect.Effect<LevelDifficultyReport, ServerError>;
  getRetention(
    dateRange: DateRange,
  ): Effect.Effect<RetentionReport, ServerError>;
}

interface CompletionRateReport {
  byGame: Record<GameId, { starts: number; completions: number; rate: number }>;
  byDifficulty: Record<
    string,
    { starts: number; completions: number; rate: number }
  >;
}

interface LevelDifficultyReport {
  levels: Array<{
    levelId: string;
    averageAttempts: number;
    completionRate: number;
    averageScore: number;
  }>;
}
```

**Implementation**: Queries Analytics Engine's SQL API. Falls back to aggregating `game_attempts` if Analytics Engine data is unavailable.

**Authorization**: Only accessible if the player has a `teacher` role in any classroom, or via a simple admin flag (future). For now, gate it behind an environment variable (`ADMIN_PLAYER_IDS`).

---

## Phase 4: Curriculum Breadth

These games are listed in priority order. Each follows the same structure as Pattern Detective above.

### 4.1 Fraction Builder

```typescript
interface FractionConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  targetNumerator: number;
  targetDenominator: number;
  availablePieces: FractionPiece[];
  maxMoves: number;
}

class FractionBuilderCompletion extends Schema.Class<FractionBuilderCompletion>(
  "FractionBuilderCompletion",
)({
  placedPieces: Schema.Array(
    Schema.Struct({
      pieceId: Schema.String,
      position: Schema.Number,
    }),
  ),
}) {}
```

**Validation**: Sum placed fraction pieces, check if they equal target. `score = timeBonus + moveBonus + (usedMinimalPieces ? 20 : 0)`.

**Skills**: fractions, addition, equivalence. Grade bands: elementary, middle.

### 4.2 Equation Balance

```typescript
interface EquationConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  leftSide: ExpressionSlot[];
  rightSide: ExpressionSlot[];
  availableTokens: Token[];
  solution: Record<string, number | string>;
}

class EquationBalanceCompletion extends Schema.Class<EquationBalanceCompletion>(
  "EquationBalanceCompletion",
)({
  placements: Schema.Record({
    key: Schema.String,
    value: Schema.Union(Schema.Number, Schema.String),
  }),
}) {}
```

**Validation**: Evaluate both sides with placed tokens. Check equality. `score = correctSlots / totalSlots * 100 + moveBonus`.

**Skills**: algebra, arithmetic, equality. Grade bands: middle, high.

### 4.3 Coordinate Quest

```typescript
interface CoordinateConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  task: "plot-point" | "reflect" | "navigate";
  targetPoints: Point[];
  gridSize: { minX: number; maxX: number; minY: number; maxY: number };
  obstacles?: Point[];
}

class CoordinateQuestCompletion extends Schema.Class<CoordinateQuestCompletion>(
  "CoordinateQuestCompletion",
)({
  placedPoints: Schema.Array(
    Schema.Struct({ x: Schema.Number, y: Schema.Number }),
  ),
}) {}
```

### 4.4 Prime Factory

```typescript
interface PrimeFactoryConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  targetNumber: number;
  maxMoves: number;
  timeLimit?: number;
}

class PrimeFactoryCompletion extends Schema.Class<PrimeFactoryCompletion>(
  "PrimeFactoryCompletion",
)({
  factorTree: Schema.Array(
    Schema.Struct({
      value: Schema.Number,
      children: Schema.Array(Schema.Number),
    }),
  ),
}) {}
```

**Validation**: Verify the factor tree is correct (all leaves are prime, product equals target). `score = movesBonus + timeBonus + (usedOptimalTree ? 20 : 0)`.

### 4.5 Geometry Sorter

```typescript
interface GeometrySorterConfig {
  id: string;
  difficulty: "easy" | "medium" | "hard";
  shapes: Shape[];
  sortCriteria: "area" | "perimeter" | "angles" | "symmetry";
  correctOrder: string[]; // shape IDs in correct sorted order
}

class GeometrySorterCompletion extends Schema.Class<GeometrySorterCompletion>(
  "GeometrySorterCompletion",
)({
  order: Schema.Array(Schema.String),
}) {}
```

---

## Curriculum Metadata Extension

To support recommendations and classroom targeting, extend `GameModule`:

```typescript
interface GameModule<TConfig> {
  // ... existing fields
  readonly curriculum?: CurriculumMetadata;
}

interface CurriculumMetadata {
  gradeBands: readonly ("elementary" | "middle" | "high")[];
  skills: readonly string[];
  estimatedMinutes: number;
  prerequisites?: readonly string[]; // Other game IDs or skill tags
}
```

This enables a future recommendation engine:

```typescript
function recommendNextGame(
  playerGradeBand: string,
  completedGames: Set<GameId>,
  weakSkills: string[],
): GameId[] {
  return GAME_MODULES.filter((m) =>
    m.curriculum?.gradeBands.includes(playerGradeBand),
  )
    .filter((m) => !completedGames.has(m.id))
    .filter(
      (m) =>
        m.curriculum?.prerequisites?.every((p) => completedGames.has(p)) ??
        true,
    )
    .sort((a, b) => {
      const aRelevance =
        a.curriculum?.skills.filter((s) => weakSkills.includes(s)).length ?? 0;
      const bRelevance =
        b.curriculum?.skills.filter((s) => weakSkills.includes(s)).length ?? 0;
      return bRelevance - aRelevance;
    })
    .map((m) => m.id);
}
```

---

## Layer Composition After All Phases

```typescript
// app-layer.ts — final state
const InfraLayer = Layer.mergeAll(
  WorkerEnvServiceLive,
  ClockServiceLive,
  RandomServiceLive,
  HeaderServiceLive,
);

const CacheLayer = KvCacheServiceLive.pipe(Layer.provide(InfraLayer));

const DataLayer = Layer.mergeAll(DbServiceLive, GameAttemptsServiceLive).pipe(
  Layer.provide(Layer.mergeAll(InfraLayer, CacheLayer)),
);

const IdentityLayer = Layer.mergeAll(
  PlayerIdentityServiceLive,
  AccountLinkServiceLive,
).pipe(Layer.provide(Layer.mergeAll(InfraLayer, DataLayer)));

const GuardLayer = Layer.mergeAll(
  RateLimitServiceLive,
  OriginGuardServiceLive,
  TurnstileServiceLive,
).pipe(Layer.provide(Layer.mergeAll(InfraLayer, CacheLayer)));

const GameLayer = Layer.mergeAll(
  DailyStreakServiceLive,
  LeaderboardServiceLive,
).pipe(Layer.provide(Layer.mergeAll(DataLayer, InfraLayer)));

const SocialLayer = Layer.mergeAll(
  ClassroomServiceLive,
  AssignmentServiceLive,
).pipe(Layer.provide(Layer.mergeAll(DataLayer, IdentityLayer)));

const AnalyticsLayer = Layer.mergeAll(
  AnalyticsServiceLive,
  AnalyticsDashboardServiceLive,
).pipe(Layer.provide(InfraLayer));

export const AppLayer = Layer.mergeAll(
  InfraLayer,
  CacheLayer,
  DataLayer,
  IdentityLayer,
  GuardLayer,
  GameLayer,
  SocialLayer,
  AnalyticsLayer,
);
```

**Dependency graph** (each layer depends only on layers above it):

```
InfraLayer (env, clock, random, headers)
  └─ CacheLayer (KV)
      └─ DataLayer (DB, attempts)
          ├─ IdentityLayer (player identity, account links)
          ├─ GameLayer (streaks, leaderboards)
          └─ SocialLayer (classrooms, assignments)
      └─ GuardLayer (rate limit, origin, turnstile)
  └─ AnalyticsLayer (tracking, dashboard)
```

---

## Implementation Order

| Step | Work                              | Dependencies | Estimated Scope |
| ---- | --------------------------------- | ------------ | --------------- |
| P0   | Registry-derived GameId           | None         | Small           |
| P1   | Split translations per module     | P0           | Medium          |
| P2   | Formalize achievement co-location | P0           | Small           |
| P3   | Game scaffolding script           | P0, P1       | Small           |
| 1.1  | Daily player results + streaks    | P0           | Medium          |
| 1.2  | Post-attempt feedback             | None         | Small per game  |
| 1.3  | Achievement/rank toasts           | None         | Small           |
| 1.4  | Resume + recommended level        | P0           | Small           |
| 1.5  | Translation completeness test     | P1           | Small           |
| 2.0  | Pattern Detective                 | P0, P1, P3   | Medium          |
| 3.1  | Game attempts table               | None         | Medium          |
| 3.2  | Classroom system                  | 3.1          | Large           |
| 3.3  | Account linking                   | None         | Medium          |
| 3.4  | Scoped leaderboards               | 3.1          | Medium          |
| 3.5  | Analytics dashboard               | 3.1          | Medium          |
| 4.x  | Additional games                  | P3, 3.1      | Medium each     |

The first four prerequisite steps (P0–P3) should be done as a single preparatory PR. After that, Phase 1 items are independent and can be parallelized. Phase 2 depends on the prerequisites. Phase 3 items are mostly independent of each other. Phase 4 games can be added incrementally.
