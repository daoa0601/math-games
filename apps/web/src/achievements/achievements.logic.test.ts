import { describe, it, expect } from 'vitest'

import { checkAchievements } from './achievements.logic'
import type { Achievement, AchievementContext } from './achievements.logic'

// Slice 0 guard — the app must consume the SINGLE-SOURCED GameModule contract from
// @math-games/core, not a drifting local mirror. Two things are pinned here:
//
//   1. (type level) The `Achievement` type the app re-exports carries `unlockWhen`.
//      The old mirror (apps/web/src/games/game-module.ts) omitted it, so the literal
//      in the last test failed `tsc` until the re-export was repointed to core.
//   2. (behavior) The central evaluator reaches core's declarative `unlockWhen`
//      engine through the registry — previously untested.

describe('checkAchievements (single-sourced contract)', () => {
  it('awards a declarative unlockWhen achievement through the central evaluator', () => {
    const ctx: AchievementContext = {
      gameId: 'equation-balance',
      completed: true,
      difficulty: 'hard',
    }

    const unlocked = checkAchievements(ctx, [])

    // global (imperative) + per-game declarative (unlockWhen) both flow through.
    expect(unlocked).toContain('global_first_steps')
    expect(unlocked).toContain('eb_first_equation') // unlockWhen: { completed: true }
    expect(unlocked).toContain('eb_hard_solver') // + difficulty: 'hard'
  })

  it('respects the unlockWhen difficulty gate', () => {
    const unlocked = checkAchievements(
      { gameId: 'equation-balance', completed: true, difficulty: 'easy' },
      [],
    )

    expect(unlocked).toContain('eb_first_equation')
    expect(unlocked).not.toContain('eb_hard_solver')
  })

  it('does not re-award already-unlocked achievements', () => {
    const unlocked = checkAchievements(
      { gameId: 'equation-balance', completed: true, difficulty: 'hard' },
      ['eb_hard_solver', 'global_first_steps'],
    )

    expect(unlocked).not.toContain('eb_hard_solver')
    expect(unlocked).not.toContain('global_first_steps')
    expect(unlocked).toContain('eb_first_equation')
  })

  it('threads skillTags through to the declarative engine without affecting non-skill gates', () => {
    // 4b: the AchievementContext carries the played level's manifest skillTags so
    // core's unlockWhen engine can gate on skill. No registry game gates on skill
    // yet (the gate behavior is proven in core/achievement-conditions.test.ts);
    // this pins that supplying skillTags is accepted and non-breaking — existing
    // completed/difficulty unlocks are unchanged.
    const ctx: AchievementContext = {
      gameId: 'equation-balance',
      completed: true,
      difficulty: 'hard',
      skillTags: ['equality_as_invariant', 'inverse_operations'],
    }

    const unlocked = checkAchievements(ctx, [])

    expect(unlocked).toContain('eb_first_equation')
    expect(unlocked).toContain('eb_hard_solver')
  })

  it('pins that the app-facing Achievement type is the core contract (carries unlockWhen)', () => {
    // Before single-sourcing, this object literal failed tsc with an excess-property
    // error because the local mirror's Achievement had no `unlockWhen` field.
    const gated: Achievement = {
      id: 'eb_first_equation',
      category: 'equation-balance',
      name: 'First Equation',
      description: 'Solve your first equation.',
      rarity: 'common',
      unlockWhen: { completed: true },
    }

    expect(gated.unlockWhen).toEqual({ completed: true })
  })
})
