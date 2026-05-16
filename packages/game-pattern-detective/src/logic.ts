import type { GameFeedback } from '@math-games/core'

import type { PatternConfig } from './catalog'
import type { PatternDetectiveCompletion } from './schema'

export function validate(
  level: PatternConfig,
  completion: PatternDetectiveCompletion,
): { completed: boolean; moves: number; feedback?: GameFeedback } {
  const selected = Number(completion.selectedAnswer)
  const correct = selected === level.answer

  if (!correct) {
    return {
      completed: false,
      moves: 1,
      feedback: {
        kind: 'generic',
        message: `${selected} is not the missing number.`,
      },
    }
  }

  return { completed: true, moves: 1 }
}

export function shuffleChoices(
  answer: number,
  distractors: readonly number[],
  seed: number,
): number[] {
  const choices = [answer, ...distractors]
  let s = seed
  for (let i = choices.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[choices[i], choices[j]] = [choices[j], choices[i]]
  }
  return choices
}
