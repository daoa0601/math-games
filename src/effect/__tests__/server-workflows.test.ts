import { Effect, Layer } from 'effect'
import { describe, expect, it, vi } from 'vitest'

import { loadDailyChallenge } from '@/daily/daily.server'
import type { GameModule } from '@/games/game-module'
import { magicGraphModule } from '@/games/MagicGraph/module'
import { recordGameProgress } from '@/games/progress/progress.server'
import { solvePuzzleEffect } from '@/games/ShapeArchitect/logic/solver'
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
import { toUserFacingError } from '@/services/run-server-effect'
import type { ServerError } from '@/services/run-server-effect'
import {
  AnalyticsService,
  ClockService,
  CrossOriginError,
  DailyChallengeError,
  DbService,
  GameProgressValidationError,
  HeaderService,
  KvCacheService,
  OriginGuardService,
  PlayerIdentityService,
  PlayerProfileError,
  PlayerProfileWriteError,
  ProgressWriteError,
  RateLimitError,
  RateLimitService,
  SolverTimeoutError,
  TurnstileService,
} from '@/services'
import type {
  AnalyticsShape,
  ClockShape,
  DbShape,
  HeaderShape,
  KvCacheShape,
  OriginGuardShape,
  PlayerIdentityShape,
  RateLimitShape,
  TurnstileShape,
} from '@/services'

vi.mock('@tanstack/react-start/server', () => ({
  getRequestHeader: vi.fn(),
  setResponseHeader: vi.fn(),
}))

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

function createPassingIdentity(): PlayerIdentityShape {
  return {
    resolve: () =>
      Effect.succeed({
        id: PLAYER_ID,
        displayName: 'Test Player',
        locale: 'en' as const,
        gradeBand: 'elementary' as const,
      }),
    resolveId: () => Effect.succeed(PLAYER_ID),
  }
}

function createPassingHeaders(): HeaderShape {
  return {
    getRequest: () => Effect.succeed(null),
    setResponse: () => Effect.void,
  }
}

function createTestClock(dateKey = '2025-01-01'): ClockShape {
  return {
    now: () => Effect.succeed(new Date(`${dateKey}T00:00:00.000Z`)),
    dateKey: () => Effect.succeed(dateKey),
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
  return {
    assert: () => Effect.void,
    assertHourlyLimit: () => Effect.void,
  }
}

function createBlockingRateLimit(): RateLimitShape {
  return {
    assert: (key: string) => Effect.fail(new RateLimitError({ key })),
    assertHourlyLimit: () => Effect.void,
  }
}

function createNoopKvCache(): KvCacheShape {
  return {
    get: () => Effect.succeed(null),
    put: () => Effect.void,
    delete: () => Effect.void,
  }
}

function createNoopAnalytics(): AnalyticsShape {
  return {
    trackGameComplete: () => Effect.void,
    trackDailyAttempt: () => Effect.void,
    trackAchievement: () => Effect.void,
  }
}

function createNoopTurnstile(): TurnstileShape {
  return {
    verify: () => Effect.void,
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
const HeaderLayer = Layer.succeed(HeaderService, createPassingHeaders())
const ClockLayer = Layer.succeed(ClockService, createTestClock())
const KvCacheLayer = Layer.succeed(KvCacheService, createNoopKvCache())
const AnalyticsLayer = Layer.succeed(AnalyticsService, createNoopAnalytics())
const TurnstileLayer = Layer.succeed(TurnstileService, createNoopTurnstile())

const TestLayer = Layer.mergeAll(
  FailingDbLayer,
  IdentityLayer,
  PassingGuardLayer,
  PassingRateLimitLayer,
  HeaderLayer,
  ClockLayer,
  KvCacheLayer,
  AnalyticsLayer,
  TurnstileLayer,
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
    ).rejects.toSatisfy((error: unknown) => error instanceof ProgressWriteError)
  })

  it('loadPlayerProfileOverview → PlayerProfileError', async () => {
    await expect(
      Effect.runPromise(
        loadPlayerProfileOverview().pipe(Effect.provide(TestLayer)),
      ),
    ).rejects.toSatisfy((error: unknown) => error instanceof PlayerProfileError)
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
      Effect.runPromise(loadDailyChallenge().pipe(Effect.provide(TestLayer))),
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
      HeaderLayer,
      AnalyticsLayer,
      TurnstileLayer,
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
    ).rejects.toSatisfy((error: unknown) => error instanceof CrossOriginError)

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
      HeaderLayer,
      AnalyticsLayer,
      TurnstileLayer,
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
      HeaderLayer,
      AnalyticsLayer,
      TurnstileLayer,
    )

    await expect(
      Effect.runPromise(
        createUpdateProfilePipeline({
          displayName: 'Test',
          locale: 'en',
          gradeBand: 'elementary',
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toSatisfy((error: unknown) => error instanceof CrossOriginError)
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
        'Missing completion payload',
      )
    })

    it('rejects completion with non-object nodeValues', () => {
      const catalog = magicGraphModule.getCatalog()
      return expectValidationError(
        magicGraphModule,
        catalog.configs[0].id,
        { nodeValues: 'not-an-object' },
        '',
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
        '',
      )
    })

    it('rejects history with wrong actor turn', () => {
      const catalog = sequenceRaceModule.getCatalog()
      const level = catalog.configs[0]
      return expectValidationError(
        sequenceRaceModule,
        level.id,
        { history: [{ actor: 'opponent', step: 1 }] },
        '',
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
        '',
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
        'Too many placements',
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
        '',
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
    expect(magicGraphModule.computeScore({ completed: true, moves: 100 })).toBe(
      20,
    )
  })

  it('SequenceRace: incomplete solution scores exactly 10', () => {
    expect(
      sequenceRaceModule.computeScore({ completed: false, moves: 0 }),
    ).toBe(10)
  })

  it('SequenceRace: completed score is clamped to [10, 100]', () => {
    expect(sequenceRaceModule.computeScore({ completed: true, moves: 0 })).toBe(
      100,
    )
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

// ---------------------------------------------------------------------------
// 7. Passing DB mock — queue-based mock for success-path tests
// ---------------------------------------------------------------------------

function createMockDb(resultQueue: unknown[]): DbShape {
  let idx = 0

  function chain(): any {
    let resolved: Promise<unknown> | null = null
    const lazy = () => (resolved ??= Promise.resolve(resultQueue[idx++]))

    return new Proxy(Object.create(null), {
      get(_, prop) {
        if (prop === 'then') return lazy().then.bind(lazy())
        if (prop === 'catch') return lazy().catch.bind(lazy())
        if (prop === 'finally') return (lazy() as any).finally.bind(lazy())
        return (..._args: unknown[]) => chain()
      },
    })
  }

  return {
    db: {
      batch: () => Promise.resolve(resultQueue[idx++]),
      select: () => chain(),
      insert: () => chain(),
    } as unknown as DbShape['db'],
  }
}

const NOW = new Date('2025-01-01T00:00:00Z')

const mockPlayerRow = {
  id: PLAYER_ID,
  displayName: 'Test Player',
  locale: 'en' as const,
  gradeBand: 'elementary' as const,
  createdAt: NOW,
  updatedAt: NOW,
}

const mockProgressRow = {
  playerId: PLAYER_ID,
  gameId: 'magic-graph' as const,
  levelId: 'easy_star_3x3',
  bestScore: 100,
  attempts: 1,
  completedAt: NOW,
  updatedAt: NOW,
}

const mockDailyChallengeRow = {
  challengeDate: '2025-01-01',
  gameId: 'magic-graph' as const,
  seed: '2025-01-01-test',
  configJson: JSON.stringify({
    gameId: 'magic-graph',
    levelId: 'easy_star_3x3',
    title: 'Easy Star',
    route: '/games/magic-graph',
    difficulty: 'easy',
  }),
  createdAt: NOW,
}

// ---------------------------------------------------------------------------
// 8. Success paths — DB workflows complete end-to-end
// ---------------------------------------------------------------------------

describe('success paths: DB workflows complete end-to-end', () => {
  it('recordGameProgress succeeds with valid input', async () => {
    const db = createMockDb([
      [[], []],
      [null, null, [mockProgressRow]],
    ])
    const layer = Layer.mergeAll(
      Layer.succeed(DbService, db),
      IdentityLayer,
      PassingGuardLayer,
      PassingRateLimitLayer,
    )

    const result = await Effect.runPromise(
      recordGameProgress({
        playerId: PLAYER_ID,
        gameId: 'magic-graph',
        levelId: 'easy_star_3x3',
        score: 100,
        completed: true,
        difficulty: 'easy',
      }).pipe(Effect.provide(layer)),
    )

    expect(result.playerId).toBe(PLAYER_ID)
    expect(result.gameId).toBe('magic-graph')
    expect(result.bestScore).toBe(100)
    expect(result.unlockedAchievements).toBeInstanceOf(Array)
  })

  it('loadDailyChallenge returns existing challenge', async () => {
    const db = createMockDb([[mockDailyChallengeRow]])
    const layer = Layer.mergeAll(Layer.succeed(DbService, db), ClockLayer, KvCacheLayer)

    const result = await Effect.runPromise(
      loadDailyChallenge().pipe(Effect.provide(layer)),
    )

    expect(result.challengeDate).toBe('2025-01-01')
    expect(result.gameId).toBe('magic-graph')
    expect(result.seed).toBe('2025-01-01-test')
  })

  it('loadDailyChallenge inserts when none exists', async () => {
    const db = createMockDb([[], [mockDailyChallengeRow]])
    const layer = Layer.mergeAll(Layer.succeed(DbService, db), ClockLayer, KvCacheLayer)

    const result = await Effect.runPromise(
      loadDailyChallenge().pipe(Effect.provide(layer)),
    )

    expect(result.challengeDate).toBe('2025-01-01')
  })

  it('loadDailyChallenge handles insert race (conflict then re-select)', async () => {
    const db = createMockDb([[], [], [mockDailyChallengeRow]])
    const layer = Layer.mergeAll(Layer.succeed(DbService, db), ClockLayer, KvCacheLayer)

    const result = await Effect.runPromise(
      loadDailyChallenge().pipe(Effect.provide(layer)),
    )

    expect(result.challengeDate).toBe('2025-01-01')
  })

  it('savePlayerProfile upserts and returns record', async () => {
    const db = createMockDb([undefined, [mockPlayerRow]])
    const layer = Layer.mergeAll(
      Layer.succeed(DbService, db),
      IdentityLayer,
      PassingGuardLayer,
      PassingRateLimitLayer,
    )

    const result = await Effect.runPromise(
      savePlayerProfile({
        displayName: 'Test Player',
        locale: 'en',
        gradeBand: 'elementary',
      }).pipe(Effect.provide(layer)),
    )

    expect(result.id).toBe(PLAYER_ID)
    expect(result.displayName).toBe('Test Player')
    expect(result.locale).toBe('en')
    expect(result.createdAt).toBeTruthy()
  })

  it('loadPlayerProfileOverview returns profile with progress and achievements', async () => {
    const db = createMockDb([
      undefined,
      [
        [mockPlayerRow],
        [mockProgressRow],
        [
          {
            playerId: PLAYER_ID,
            achievementId: 'mg_first_solve',
            unlockedAt: NOW,
          },
        ],
      ],
    ])
    const layer = Layer.mergeAll(Layer.succeed(DbService, db), IdentityLayer)

    const result = await Effect.runPromise(
      loadPlayerProfileOverview().pipe(Effect.provide(layer)),
    )

    expect(result.profile.id).toBe(PLAYER_ID)
    expect(result.progress).toHaveLength(1)
    expect(result.progress[0].gameId).toBe('magic-graph')
    expect(result.achievements).toContain('mg_first_solve')
  })
})

// ---------------------------------------------------------------------------
// 9. runServerEffect error mapping — domain errors become user-facing messages
// ---------------------------------------------------------------------------

describe('runServerEffect error mapping', () => {
  function expectMappedError(error: ServerError, expectedMessage: string) {
    expect(toUserFacingError(error).message).toBe(expectedMessage)
  }

  it('RateLimitError → user-facing message', () =>
    expectMappedError(
      new RateLimitError({ key: 'test' }),
      'Too many requests. Please wait a moment.',
    ))

  it('CrossOriginError → user-facing message', () =>
    expectMappedError(
      new CrossOriginError({ reason: 'blocked' }),
      'Request blocked.',
    ))

  it('GameProgressValidationError preserves reason', () =>
    expectMappedError(
      new GameProgressValidationError({ reason: 'Invalid levelId' }),
      'Invalid levelId',
    ))

  it('ProgressWriteError → user-facing message', () =>
    expectMappedError(
      new ProgressWriteError({ cause: new Error('db down') }),
      'Unable to save game progress.',
    ))

  it('DailyChallengeError → user-facing message', () =>
    expectMappedError(
      new DailyChallengeError({ cause: new Error('db down') }),
      "Unable to load today's challenge.",
    ))

  it('PlayerProfileError → user-facing message', () =>
    expectMappedError(
      new PlayerProfileError({ cause: new Error('db down') }),
      'Unable to load your profile.',
    ))

  it('PlayerProfileWriteError → user-facing message', () =>
    expectMappedError(
      new PlayerProfileWriteError({ cause: new Error('db down') }),
      'Unable to save your profile.',
    ))
})

// ---------------------------------------------------------------------------
// 10. solvePuzzleEffect — typed error channel for solver
// ---------------------------------------------------------------------------

describe('solvePuzzleEffect', () => {
  it('succeeds for a solvable puzzle', async () => {
    const catalog = shapeArchitectModule.getCatalog()
    const level = catalog.configs[0]

    const result = await Effect.runPromise(solvePuzzleEffect(level))

    expect(result.solvable).toBe(true)
    expect(result.solution).toBeDefined()
    expect(result.timedOut).toBe(false)
  })

  it('fails with SolverTimeoutError when maxTimeMs is 0', async () => {
    const catalog = shapeArchitectModule.getCatalog()
    const level = catalog.configs[0]

    await expect(
      Effect.runPromise(solvePuzzleEffect(level, 0)),
    ).rejects.toSatisfy((error: unknown) => {
      if (!(error instanceof SolverTimeoutError)) return false
      expect(error.timeMs).toBeGreaterThanOrEqual(0)
      expect(error.searchedStates).toBeGreaterThanOrEqual(0)
      return true
    })
  })
})
