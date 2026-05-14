import { Effect, Layer } from 'effect'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-start/server', () => ({
  setResponseHeader: vi.fn(),
}))

import { loadDailyChallenge } from '@/daily/daily.server'
import type { GameModule } from '@/games/game-module'
import { magicGraphModule } from '@/games/MagicGraph/module'
import { recordGameProgress } from '@/games/progress/progress.server'
import {
  createRecordProgressPipeline,
  createUpdateProfilePipeline,
} from '@/games/server-handlers'
import { sequenceRaceModule } from '@/games/SequenceRace/module'
import { shapeArchitectModule } from '@/games/ShapeArchitect/module'
import {
  loadPlayerProfileOverview,
  savePlayerProfile,
} from '@/player/profile.server'
import {
  CrossOriginError,
  DailyChallengeError,
  DbService,
  GameProgressValidationError,
  OriginGuardService,
  PlayerIdentityService,
  PlayerProfileError,
  PlayerProfileWriteError,
  ProgressWriteError,
  RateLimitError,
  RateLimitService,
} from '@/services'
import type { DbShape } from '@/services'
import type { OriginGuardShape } from '@/services'
import type { RateLimitShape } from '@/services'

// ---------------------------------------------------------------------------
// Shared mock factories
// ---------------------------------------------------------------------------

const PLAYER_ID = 'player_test'

function createFailingDb(): DbShape {
  const reject = () => Promise.reject(new Error('D1 binding unavailable'))
  return {
    db: {
      batch: reject,
      select: () => ({
        from: () => ({
          where: () => ({
            limit: () => reject(),
            orderBy: () => reject(),
          }),
          orderBy: () => reject(),
          groupBy: () => reject(),
        }),
      }),
      insert: () => ({
        values: () => ({
          onConflictDoUpdate: () => ({
            returning: () => reject(),
          }),
          onConflictDoNothing: () => ({
            returning: () => reject(),
          }),
        }),
      }),
    } as unknown as DbShape['db'],
  }
}

function createPassingIdentity() {
  return {
    getCurrentId: () => PLAYER_ID,
    getCurrent: () => ({
      id: PLAYER_ID,
      displayName: 'Test Player',
      locale: 'en' as const,
      gradeBand: 'elementary' as const,
    }),
  }
}

function createPassingOriginGuard(): OriginGuardShape {
  return { assert: () => Effect.void }
}

function createBlockingOriginGuard(): OriginGuardShape {
  return {
    assert: () =>
      Effect.fail(new CrossOriginError({ reason: 'cross-origin blocked' })),
  }
}

function createPassingRateLimit(): RateLimitShape {
  return { assert: () => Effect.void }
}

function createBlockingRateLimit(): RateLimitShape {
  return {
    assert: (key: string) => Effect.fail(new RateLimitError({ key })),
  }
}

const FailingDbLayer = Layer.succeed(DbService, createFailingDb())
const IdentityLayer = Layer.succeed(
  PlayerIdentityService,
  createPassingIdentity(),
)
const PassingGuardLayer = Layer.succeed(
  OriginGuardService,
  createPassingOriginGuard(),
)
const PassingRateLimitLayer = Layer.succeed(
  RateLimitService,
  createPassingRateLimit(),
)

const TestLayer = Layer.mergeAll(
  FailingDbLayer,
  IdentityLayer,
  PassingGuardLayer,
  PassingRateLimitLayer,
)

// ---------------------------------------------------------------------------
// 1. Error boundary tests — DB failures map to domain errors
// ---------------------------------------------------------------------------

describe('error boundaries: DB failures map to domain errors', () => {
  it('recordGameProgress → ProgressWriteError', async () => {
    await expect(
      Effect.runPromise(
        recordGameProgress({
          playerId: PLAYER_ID,
          gameId: 'sequence-race',
          levelId: 'arithmetic-run',
          score: 100,
          completed: true,
        }).pipe(Effect.provide(TestLayer)),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof ProgressWriteError,
    )
  })

  it('loadPlayerProfileOverview → PlayerProfileError', async () => {
    await expect(
      Effect.runPromise(
        loadPlayerProfileOverview().pipe(Effect.provide(TestLayer)),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof PlayerProfileError,
    )
  })

  it('savePlayerProfile → PlayerProfileWriteError', async () => {
    await expect(
      Effect.runPromise(
        savePlayerProfile({
          displayName: 'Mai Tran',
          locale: 'vi',
          gradeBand: 'middle',
        }).pipe(Effect.provide(TestLayer)),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof PlayerProfileWriteError,
    )
  })

  it('loadDailyChallenge → DailyChallengeError', async () => {
    await expect(
      Effect.runPromise(
        loadDailyChallenge(new Date('2026-05-14T00:00:00.000Z')).pipe(
          Effect.provide(TestLayer),
        ),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof DailyChallengeError,
    )
  })
})

// ---------------------------------------------------------------------------
// 2. Guard ordering — origin guard and rate limit fire before business logic
// ---------------------------------------------------------------------------

describe('guard ordering in pipelines', () => {
  it('origin guard rejects before any DB access', async () => {
    const dbSpy = vi.fn(() => Promise.reject(new Error('should not reach DB')))
    const spyDbLayer = Layer.succeed(DbService, {
      db: { batch: dbSpy } as unknown as DbShape['db'],
    })
    const blockedGuardLayer = Layer.succeed(
      OriginGuardService,
      createBlockingOriginGuard(),
    )

    const layer = Layer.mergeAll(
      spyDbLayer,
      IdentityLayer,
      blockedGuardLayer,
      PassingRateLimitLayer,
    )

    const catalog = magicGraphModule.getCatalog()
    const levelId = catalog.configs[0].id

    await expect(
      Effect.runPromise(
        createRecordProgressPipeline(magicGraphModule, {
          levelId,
          completion: { nodeValues: {} },
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof CrossOriginError,
    )

    expect(dbSpy).not.toHaveBeenCalled()
  })

  it('rate limit rejects before DB writes', async () => {
    const dbSpy = vi.fn(() => Promise.reject(new Error('should not reach DB')))
    const spyDbLayer = Layer.succeed(DbService, {
      db: { batch: dbSpy } as unknown as DbShape['db'],
    })
    const blockedRateLimitLayer = Layer.succeed(
      RateLimitService,
      createBlockingRateLimit(),
    )

    const layer = Layer.mergeAll(
      spyDbLayer,
      IdentityLayer,
      PassingGuardLayer,
      blockedRateLimitLayer,
    )

    const catalog = magicGraphModule.getCatalog()
    const levelId = catalog.configs[0].id

    await expect(
      Effect.runPromise(
        createRecordProgressPipeline(magicGraphModule, {
          levelId,
          completion: { nodeValues: {} },
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toSatisfy((error: unknown) => error instanceof RateLimitError)

    expect(dbSpy).not.toHaveBeenCalled()
  })

  it('profile update pipeline respects guard ordering', async () => {
    const blockedGuardLayer = Layer.succeed(
      OriginGuardService,
      createBlockingOriginGuard(),
    )

    const layer = Layer.mergeAll(
      FailingDbLayer,
      IdentityLayer,
      blockedGuardLayer,
      PassingRateLimitLayer,
    )

    await expect(
      Effect.runPromise(
        createUpdateProfilePipeline({
          displayName: 'Test',
          locale: 'en',
          gradeBand: 'elementary',
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toSatisfy(
      (error: unknown) => error instanceof CrossOriginError,
    )
  })
})

// ---------------------------------------------------------------------------
// 3. Validation integration — real modules reject bad data through pipeline
// ---------------------------------------------------------------------------

describe('validation through real game modules', () => {
  function expectValidationError(
    module: GameModule<any>,
    levelId: string,
    completion: unknown,
    expectedSubstring: string,
  ) {
    return expect(
      Effect.runPromise(
        createRecordProgressPipeline(module, { levelId, completion }).pipe(
          Effect.provide(TestLayer),
        ),
      ),
    ).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof GameProgressValidationError)) return false
      return error.reason.includes(expectedSubstring)
    })
  }

  describe('MagicGraph', () => {
    it('rejects unknown level IDs', () =>
      expectValidationError(
        magicGraphModule,
        'nonexistent-level-xyz',
        { nodeValues: {} },
        'Unknown level',
      ))

    it('rejects null completion', () => {
      const catalog = magicGraphModule.getCatalog()
      return expectValidationError(
        magicGraphModule,
        catalog.configs[0].id,
        null,
        'Invalid game state',
      )
    })

    it('rejects completion with non-object nodeValues', () => {
      const catalog = magicGraphModule.getCatalog()
      return expectValidationError(
        magicGraphModule,
        catalog.configs[0].id,
        { nodeValues: 'not-an-object' },
        'Invalid game state',
      )
    })

    it('rejects completion with out-of-range numbers', () => {
      const catalog = magicGraphModule.getCatalog()
      const level = catalog.configs[0]
      const badValues: Record<string, number> = {}
      for (const node of level.nodes) {
        if (!node.isFixed) badValues[node.id] = 99999
      }
      return expectValidationError(
        magicGraphModule,
        level.id,
        { nodeValues: badValues },
        'Invalid game state',
      )
    })

    it('rejects completion with duplicate numbers', () => {
      const catalog = magicGraphModule.getCatalog()
      const level = catalog.configs[0]
      const editableNodes = level.nodes.filter((n) => !n.isFixed)
      if (editableNodes.length < 2) return
      const dupValues: Record<string, number> = {}
      const firstAvailable = level.availableNumbers[0]
      for (const node of editableNodes) {
        dupValues[node.id] = firstAvailable
      }
      return expectValidationError(
        magicGraphModule,
        level.id,
        { nodeValues: dupValues },
        'Invalid game state',
      )
    })
  })

  describe('SequenceRace', () => {
    it('rejects unknown level IDs', () =>
      expectValidationError(
        sequenceRaceModule,
        'nonexistent-race-xyz',
        { history: [] },
        'Unknown level',
      ))

    it('rejects completion with non-array history', () => {
      const catalog = sequenceRaceModule.getCatalog()
      return expectValidationError(
        sequenceRaceModule,
        catalog.configs[0].id,
        { history: 'bad' },
        'Invalid game state',
      )
    })

    it('rejects history with wrong actor turn', () => {
      const catalog = sequenceRaceModule.getCatalog()
      const level = catalog.configs[0]
      return expectValidationError(
        sequenceRaceModule,
        level.id,
        { history: [{ actor: 'opponent', step: 1 }] },
        'Invalid game state',
      )
    })
  })

  describe('ShapeArchitect', () => {
    it('rejects unknown level IDs', () =>
      expectValidationError(
        shapeArchitectModule,
        'nonexistent-shape-xyz',
        { placements: [] },
        'Unknown level',
      ))

    it('rejects completion with non-array placements', () => {
      const catalog = shapeArchitectModule.getCatalog()
      return expectValidationError(
        shapeArchitectModule,
        catalog.configs[0].id,
        { placements: 'bad' },
        'Invalid game state',
      )
    })

    it('rejects placements exceeding max count', () => {
      const catalog = shapeArchitectModule.getCatalog()
      const level = catalog.configs[0]
      const oversized = Array.from({ length: 65 }, () => ({
        pieceId: 'fake',
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
      }))
      return expectValidationError(
        shapeArchitectModule,
        level.id,
        { placements: oversized },
        'Invalid game state',
      )
    })

    it('rejects placements with invalid rotation angles', () => {
      const catalog = shapeArchitectModule.getCatalog()
      const level = catalog.configs[0]
      return expectValidationError(
        shapeArchitectModule,
        level.id,
        {
          placements: [
            {
              pieceId: level.pieces[0]?.id ?? 'p1',
              position: { x: 0, y: 0, z: 0 },
              rotation: { x: 45, y: 0, z: 0 },
            },
          ],
        },
        'Invalid game state',
      )
    })
  })
})

// ---------------------------------------------------------------------------
// 4. Score computation invariants — the server controls scores, not clients
// ---------------------------------------------------------------------------

describe('score computation invariants', () => {
  it('MagicGraph: incomplete solution scores exactly 10', () => {
    expect(magicGraphModule.computeScore({ completed: false, moves: 0 })).toBe(
      10,
    )
    expect(
      magicGraphModule.computeScore({ completed: false, moves: 100 }),
    ).toBe(10)
  })

  it('MagicGraph: completed score is clamped to [20, 100]', () => {
    expect(magicGraphModule.computeScore({ completed: true, moves: 0 })).toBe(
      100,
    )
    expect(
      magicGraphModule.computeScore({ completed: true, moves: 100 }),
    ).toBe(20)
  })

  it('SequenceRace: incomplete solution scores exactly 10', () => {
    expect(
      sequenceRaceModule.computeScore({ completed: false, moves: 0 }),
    ).toBe(10)
  })

  it('SequenceRace: completed score is clamped to [10, 100]', () => {
    expect(
      sequenceRaceModule.computeScore({ completed: true, moves: 0 }),
    ).toBe(100)
    expect(
      sequenceRaceModule.computeScore({ completed: true, moves: 100 }),
    ).toBe(10)
  })

  it('ShapeArchitect: incomplete solution scores exactly 10', () => {
    expect(
      shapeArchitectModule.computeScore({ completed: false, moves: 0 }),
    ).toBe(10)
  })

  it('ShapeArchitect: completed score is clamped to [20, 100]', () => {
    expect(
      shapeArchitectModule.computeScore({ completed: true, moves: 0 }),
    ).toBe(100)
    expect(
      shapeArchitectModule.computeScore({ completed: true, moves: 100 }),
    ).toBe(20)
  })

  it('scores are always integers (no floating point leaks)', () => {
    for (const mod of [
      magicGraphModule,
      sequenceRaceModule,
      shapeArchitectModule,
    ]) {
      for (let moves = 0; moves <= 30; moves++) {
        const score = mod.computeScore({ completed: true, moves })
        expect(Number.isInteger(score)).toBe(true)
      }
    }
  })
})

// ---------------------------------------------------------------------------
// 5. Module registry completeness — every module satisfies GameModule
// ---------------------------------------------------------------------------

describe('module registry completeness', () => {
  const modules = [
    magicGraphModule,
    sequenceRaceModule,
    shapeArchitectModule,
  ] as const

  for (const mod of modules) {
    describe(mod.id, () => {
      it('has a non-empty catalog', () => {
        const catalog = mod.getCatalog()
        expect(catalog.configs.length).toBeGreaterThan(0)
        expect(catalog.initialConfigId).toBeTruthy()
        expect(
          catalog.configs.some((c) => c.id === catalog.initialConfigId),
        ).toBe(true)
      })

      it('resolveLevelConfig finds every catalog entry', () => {
        const catalog = mod.getCatalog()
        for (const config of catalog.configs) {
          expect(mod.resolveLevelConfig(config.id)).not.toBeNull()
        }
      })

      it('resolveLevelConfig returns null for garbage', () => {
        expect(mod.resolveLevelConfig('')).toBeNull()
        expect(mod.resolveLevelConfig('definitely-not-a-level')).toBeNull()
      })

      it('getDailyPick returns valid entries for varied hashes', () => {
        const seen = new Set<string>()
        for (let h = 0; h < 100; h++) {
          const pick = mod.getDailyPick(h)
          expect(pick.levelId).toBeTruthy()
          expect(pick.title).toBeTruthy()
          expect(pick.difficulty).toBeTruthy()
          seen.add(pick.levelId)
        }
        expect(seen.size).toBeGreaterThan(1)
      })

      it('has at least one achievement', () => {
        expect(mod.achievements.length).toBeGreaterThan(0)
        for (const ach of mod.achievements) {
          expect(ach.id).toBeTruthy()
          expect(ach.category).toBe(mod.id)
        }
      })

      it('exposes progressExtras', () => {
        expect(mod.progressExtras).toBeDefined()
        expect(typeof mod.progressExtras).toBe('function')
      })
    })
  }
})

// ---------------------------------------------------------------------------
// 6. Practice level generation — seeded levels resolve correctly
// ---------------------------------------------------------------------------

describe('practice level generation', () => {
  it('MagicGraph: practice levels resolve with valid config', () => {
    const config = magicGraphModule.resolveLevelConfig('practice_easy_test123')
    expect(config).not.toBeNull()
    expect(config!.difficulty).toBe('easy')
    expect(config!.nodes.length).toBeGreaterThan(0)
    expect(config!.availableNumbers.length).toBeGreaterThan(0)
  })

  it('MagicGraph: same seed produces identical config', () => {
    const a = magicGraphModule.resolveLevelConfig('practice_medium_seed42')
    const b = magicGraphModule.resolveLevelConfig('practice_medium_seed42')
    expect(a).toEqual(b)
  })

  it('MagicGraph: rejects invalid practice difficulty', () => {
    expect(
      magicGraphModule.resolveLevelConfig('practice_master_seed1'),
    ).toBeNull()
    expect(
      magicGraphModule.resolveLevelConfig('practice_grandmaster_seed1'),
    ).toBeNull()
  })

  it('SequenceRace: practice levels resolve', () => {
    const config = sequenceRaceModule.resolveLevelConfig(
      'practice_easy_test123',
    )
    expect(config).not.toBeNull()
    expect(config!.difficulty).toBe('easy')
  })

  it('ShapeArchitect: practice levels resolve', () => {
    const config = shapeArchitectModule.resolveLevelConfig(
      'practice_easy_test123',
    )
    expect(config).not.toBeNull()
    expect(config!.difficulty).toBe('easy')
  })
})
