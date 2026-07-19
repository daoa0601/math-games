import type { GameFeedback } from "@math-games/core";

import type { PatternConfig } from "./catalog";
import type { PatternDetectiveCompletion } from "./schema";

/**
 * Pick a targeted feedback label for a wrong answer. Instead of a single
 * generic "not the missing number" string, we look at the answer relative to
 * its neighbours and tell the player whether their guess was too large, too
 * small, or simply off-pattern. The label keys live in translations.ts and
 * are localized like every other game's misconception feedback.
 */
function diagnoseWrong(
  level: PatternConfig,
  selected: number,
): { labelKey: string; params: Record<string, string | number> } {
  const { sequence, missingIndex, answer } = level;
  const prev = sequence[missingIndex - 1];
  const next = sequence[missingIndex + 1];

  if (typeof prev === "number" && prev >= 0 && selected > answer) {
    return {
      labelKey: "pd.feedback.too_large",
      params: { selected },
    };
  }
  if (typeof next === "number" && next >= 0 && selected < answer) {
    return {
      labelKey: "pd.feedback.too_small",
      params: { selected },
    };
  }
  // Fallback — the guess is in-range but off-pattern.
  return {
    labelKey: "pd.feedback.wrong_substitution",
    params: { selected },
  };
}

export function validate(
  level: PatternConfig,
  completion: PatternDetectiveCompletion,
): { completed: boolean; moves: number; feedback?: GameFeedback } {
  const selected = Number(completion.selectedAnswer);
  const correct = selected === level.answer;

  if (!correct) {
    const { labelKey, params } = diagnoseWrong(level, selected);
    return {
      completed: false,
      moves: 1,
      feedback: { kind: "misconception", labelKey, params },
    };
  }

  return { completed: true, moves: 1 };
}

export function shuffleChoices(
  answer: number,
  distractors: readonly number[],
  seed: number,
): number[] {
  const choices = [answer, ...distractors];
  let s = seed;
  for (let i = choices.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
