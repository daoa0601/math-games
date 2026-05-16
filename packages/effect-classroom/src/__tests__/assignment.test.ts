import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { AuthorizationError } from '@math-games/effect-infra'
import { DbService, PlayerIdentityService } from '@math-games/effect-game'

import { AssignmentService, AssignmentServiceLive } from '../assignment'

function createHarness(opts: {
  playerId: string
  membershipResult?: Array<{ role: string }>
  assignmentRows?: unknown[]
  classroomRows?: Array<{ classroomId: string; classroomName: string }>
}) {
  let insertedValues: unknown[] = []
  let selectCallIndex = 0

  const identityLayer = Layer.succeed(PlayerIdentityService, {
    resolve: () =>
      Effect.succeed({
        id: opts.playerId,
        displayName: 'Test',
        locale: 'en' as const,
        gradeBand: 'elementary' as const,
      }),
    resolveId: () => Effect.succeed(opts.playerId),
  })

  // The service makes multiple select calls in sequence.
  // We need to return different results for membership checks vs data fetches.
  const selectResults = [
    opts.membershipResult ?? [],
    opts.assignmentRows ?? opts.classroomRows ?? [],
    opts.assignmentRows ?? [],
  ]

  const dbLayer = Layer.succeed(DbService, {
    db: {
      insert: () => ({
        values: (vals: unknown) => {
          insertedValues.push(vals)
          return Promise.resolve()
        },
      }),
      select: () => {
        const resultIndex = selectCallIndex
        selectCallIndex++
        const result = selectResults[resultIndex] ?? []
        const chain = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          limit: () => Promise.resolve(result),
          then: (resolve: (val: unknown[]) => void) => resolve(result),
        }
        return chain
      },
    } as never,
  })

  const layer = AssignmentServiceLive.pipe(
    Layer.provide(Layer.mergeAll(identityLayer, dbLayer)),
  )

  return { layer, insertedValues }
}

describe('AssignmentService.create', () => {
  it('creates an assignment when the caller is a teacher', async () => {
    const { layer } = createHarness({
      playerId: 'teacher-1',
      membershipResult: [{ role: 'teacher' }],
    })

    const assignment = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AssignmentService
        return yield* service.create({
          classroomId: 'classroom-1',
          title: 'Homework Week 3',
          gameId: 'magic-graph',
          levelIds: ['level-1', 'level-2'],
          dueDate: '2025-02-01',
        })
      }).pipe(Effect.provide(layer)),
    )

    expect(assignment.title).toBe('Homework Week 3')
    expect(assignment.gameId).toBe('magic-graph')
    expect(assignment.levelIds).toEqual(['level-1', 'level-2'])
    expect(assignment.classroomId).toBe('classroom-1')
    expect(assignment.dueDate).toBe('2025-02-01')
    expect(assignment.id).toBeTruthy()
  })

  it('defaults dueDate to null when not provided', async () => {
    const { layer } = createHarness({
      playerId: 'teacher-1',
      membershipResult: [{ role: 'teacher' }],
    })

    const assignment = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AssignmentService
        return yield* service.create({
          classroomId: 'classroom-1',
          title: 'No Due Date',
          gameId: 'sequence-race',
          levelIds: ['l1'],
        })
      }).pipe(Effect.provide(layer)),
    )

    expect(assignment.dueDate).toBe(null)
  })

  it('rejects with AuthorizationError when caller is a student', async () => {
    const { layer } = createHarness({
      playerId: 'student-1',
      membershipResult: [{ role: 'student' }],
    })

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AssignmentService
          return yield* service.create({
            classroomId: 'classroom-1',
            title: 'Hacked Homework',
            gameId: 'magic-graph',
            levelIds: ['level-1'],
          })
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('rejects with AuthorizationError when caller has no membership', async () => {
    const { layer } = createHarness({
      playerId: 'outsider-1',
      membershipResult: [],
    })

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AssignmentService
          return yield* service.create({
            classroomId: 'classroom-1',
            title: 'Unauthorized',
            gameId: 'magic-graph',
            levelIds: [],
          })
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})

describe('AssignmentService.getForClassroom', () => {
  it('returns assignments with parsed levelIds when caller is a member', async () => {
    const { layer } = createHarness({
      playerId: 'teacher-1',
      membershipResult: [{ role: 'teacher' }],
      assignmentRows: [
        {
          id: 'a1',
          classroomId: 'c1',
          title: 'HW1',
          gameId: 'magic-graph',
          levelIds: '["level-1","level-2"]',
          dueDate: '2025-03-01',
          createdAt: new Date(),
        },
      ],
    })

    const assignments = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AssignmentService
        return yield* service.getForClassroom('c1')
      }).pipe(Effect.provide(layer)),
    )

    expect(assignments.length).toBe(1)
    expect(assignments[0].title).toBe('HW1')
    expect(assignments[0].levelIds).toEqual(['level-1', 'level-2'])
    expect(assignments[0].completedByCount).toBe(0)
    expect(assignments[0].totalMembers).toBe(0)
  })

  it('rejects with AuthorizationError when caller is not a member', async () => {
    const { layer } = createHarness({
      playerId: 'outsider',
      membershipResult: [],
    })

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* AssignmentService
          return yield* service.getForClassroom('c1')
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })
})

describe('AssignmentService.getForStudent', () => {
  it('returns empty array when student has no classrooms', async () => {
    const { layer } = createHarness({
      playerId: 'lonely-student',
      classroomRows: [],
    })

    const assignments = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AssignmentService
        return yield* service.getForStudent()
      }).pipe(Effect.provide(layer)),
    )

    expect(assignments).toEqual([])
  })
})
