import type {
  AchievementContext,
  DailyChallengePick,
  GameFeedback,
  GameProgressInput,
} from "@math-games/core";
import { createGameModule } from "@math-games/core";
import { sequenceRaceTranslations } from "./translations";

import {
  applyMove,
  createGameState,
  getValidMoves,
  presetGames,
} from "./logic";
import type { GameConfig, HistoryEntry } from "./logic";
import { SequenceRaceCompletion as SequenceRaceCompletionSchema } from "./schema";
import {
  getSequenceRaceCatalog,
  getSequenceRacePracticeConfig,
} from "./catalog";
import type { SequenceRaceDifficulty } from "./catalog";

const difficulties = ["easy", "medium", "hard"] as const;

const practiceDifficulties: readonly SequenceRaceDifficulty[] = [
  "easy",
  "medium",
  "hard",
];

const practiceIdPattern = /^practice_(easy|medium|hard)_(.+)$/;

const MAX_HISTORY_LENGTH = 200;

export interface SequenceRaceCompletion {
  history: Array<{ actor: HistoryEntry["actor"]; step: number }>;
}

const cachedCatalog = getSequenceRaceCatalog();

function getDailyPick(hash: number): DailyChallengePick {
  const config = presetGames[hash % presetGames.length];
  return {
    levelId: config.id,
    title: config.name,
    difficulty: config.difficulty,
  };
}

function resolveLevelConfig(levelId: string): GameConfig | null {
  const preset = presetGames.find((c) => c.id === levelId);
  if (preset) return preset;

  const match = levelId.match(practiceIdPattern);
  if (!match) return null;

  const difficulty = match[1] as SequenceRaceDifficulty;
  if (!practiceDifficulties.includes(difficulty)) return null;

  return getSequenceRacePracticeConfig(match[2], difficulty);
}

function validateGameState(
  level: GameConfig,
  raw: unknown,
): { completed: boolean; moves: number; feedback?: GameFeedback } | null {
  if (raw === null || typeof raw !== "object") return null;

  const completion = raw as Partial<SequenceRaceCompletion>;
  if (!Array.isArray(completion.history)) return null;
  if (completion.history.length > MAX_HISTORY_LENGTH) return null;

  let state = createGameState(level);

  for (const entry of completion.history as unknown[]) {
    if (state.gameOver) return null;
    if (entry === null || typeof entry !== "object") return null;

    const actor = (entry as { actor?: unknown }).actor;
    const step = (entry as { step?: unknown }).step;

    if (typeof actor !== "string" || typeof step !== "number") return null;
    if (!Number.isInteger(step)) return null;
    if (actor !== state.turn) return null;
    if (!getValidMoves(state).includes(step)) return null;

    state = applyMove(state, step);
  }

  const completed = state.gameOver && state.winner === "player";
  const moves = Math.max(0, state.history.length - 1);

  if (state.gameOver && state.winner === "ai") {
    const lastMove = state.history.at(-1);
    return {
      completed,
      moves,
      feedback: {
        kind: "ai-forced-win" as const,
        finalMove: lastMove?.step ?? 0,
      },
    };
  }

  return { completed, moves };
}

function evaluateAchievements(
  ctx: AchievementContext,
  unlocked: ReadonlySet<string>,
): string[] {
  const newly: string[] = [];
  if (ctx.wasWinner === true && !unlocked.has("sr_first_victory")) {
    newly.push("sr_first_victory");
  }
  if (
    ctx.wasWinner === true &&
    ctx.difficulty === "hard" &&
    !unlocked.has("sr_hard_winner")
  ) {
    newly.push("sr_hard_winner");
  }
  return newly;
}

export const sequenceRaceModule = createGameModule({
  id: "sequence-race",
  route: "/games/sequence-race",
  title: "Sequence Race",
  description: "Turn-based sequence strategy with adaptive levels.",
  difficulties,
  catalog: cachedCatalog.configs,
  completionSchema: SequenceRaceCompletionSchema,
  translations: sequenceRaceTranslations,
  getCatalog: () => cachedCatalog,
  levelCount: cachedCatalog.configs.length,
  getDailyPick,
  resolveLevelConfig,
  validateGameState,
  computeScore: ({ completed, moves }) =>
    completed ? Math.max(10, 100 - moves * 8) : 10,
  evaluateAchievements,
  progressExtras: (input: GameProgressInput) => ({
    wasWinner: input.completed,
  }),
  achievements: [
    {
      id: "sr_first_victory",
      category: "sequence-race",
      name: "First Victory",
      description: "Win a Sequence Race.",
      rarity: "common",
    },
    {
      id: "sr_hard_winner",
      category: "sequence-race",
      name: "Hard Winner",
      description: "Win a hard Sequence Race.",
      rarity: "epic",
    },
  ],
});
