import { and, eq } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'

import { schema } from '@math-games/db'

import { AuthorizationError, ClassroomError, withD1Retry } from '@math-games/effect-infra'
import { DbService, PlayerIdentityService } from '@math-games/effect-game'

function parseStringArray(json: string): readonly string[] {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.every((item): item is string => typeof item === 'string')
      ? parsed
      : []
  } catch {
    return []
  }
}

export interface Assignment {
  id: string
  classroomId: string
  title: string
  gameId: string
  levelIds: readonly string[]
  dueDate: string | null
}

export interface AssignmentWithProgress extends Assignment {
  completedByCount: number
  totalMembers: number
}

export interface StudentAssignment extends Assignment {
  classroomName: string
  completed: boolean
}

export interface AssignmentShape {
  readonly create: (input: {
    classroomId: string
    title: string
    gameId: string
    levelIds: readonly string[]
    dueDate?: string
  }) => Effect.Effect<Assignment, ClassroomError | AuthorizationError>

  readonly getForClassroom: (
    classroomId: string,
  ) => Effect.Effect<
    AssignmentWithProgress[],
    ClassroomError | AuthorizationError
  >

  readonly getForStudent: () => Effect.Effect<
    StudentAssignment[],
    ClassroomError | AuthorizationError
  >
}

export const AssignmentService =
  Context.Service<AssignmentShape>('AssignmentService')

function generateId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export const AssignmentServiceLive = Layer.effect(
  AssignmentService,
  Effect.all([DbService, PlayerIdentityService]).pipe(
    Effect.map(([{ db }, identity]) => ({
      create: (input) =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()

          const membership = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({ role: schema.classroomMembers.role })
                  .from(schema.classroomMembers)
                  .where(
                    and(
                      eq(
                        schema.classroomMembers.classroomId,
                        input.classroomId,
                      ),
                      eq(schema.classroomMembers.playerId, playerId),
                    ),
                  )
                  .limit(1),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          if (!membership[0] || membership[0].role !== 'teacher') {
            return yield* new AuthorizationError({
              reason: 'Not a teacher of this classroom',
            })
          }

          const id = generateId()
          const assignment: Assignment = {
            id,
            classroomId: input.classroomId,
            title: input.title,
            gameId: input.gameId,
            levelIds: input.levelIds,
            dueDate: input.dueDate ?? null,
          }

          yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db.insert(schema.assignments).values({
                  id,
                  classroomId: input.classroomId,
                  title: input.title,
                  gameId: input.gameId,
                  levelIds: JSON.stringify(input.levelIds),
                  dueDate: input.dueDate,
                }),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return assignment
        }),

      getForClassroom: (classroomId) =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()

          const membership = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({ role: schema.classroomMembers.role })
                  .from(schema.classroomMembers)
                  .where(
                    and(
                      eq(schema.classroomMembers.classroomId, classroomId),
                      eq(schema.classroomMembers.playerId, playerId),
                    ),
                  )
                  .limit(1),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          if (!membership[0]) {
            return yield* new AuthorizationError({
              reason: 'Not a member of this classroom',
            })
          }

          const rows = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select()
                  .from(schema.assignments)
                  .where(eq(schema.assignments.classroomId, classroomId))
                  .orderBy(schema.assignments.createdAt),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return rows.map((r) => ({
            id: r.id,
            classroomId: r.classroomId,
            title: r.title,
            gameId: r.gameId,
            levelIds: parseStringArray(r.levelIds),
            dueDate: r.dueDate,
            completedByCount: 0,
            totalMembers: 0,
          }))
        }),

      getForStudent: () =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()

          const myClassrooms = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({
                    classroomId: schema.classroomMembers.classroomId,
                    classroomName: schema.classrooms.name,
                  })
                  .from(schema.classroomMembers)
                  .innerJoin(
                    schema.classrooms,
                    eq(
                      schema.classroomMembers.classroomId,
                      schema.classrooms.id,
                    ),
                  )
                  .where(
                    eq(schema.classroomMembers.playerId, playerId),
                  ),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          if (myClassrooms.length === 0) return []

          const classroomIds = myClassrooms.map((c) => c.classroomId)
          const nameMap = new Map(
            myClassrooms.map((c) => [c.classroomId, c.classroomName]),
          )

          const allAssignments = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select()
                  .from(schema.assignments)
                  .where(
                    classroomIds.length === 1
                      ? eq(schema.assignments.classroomId, classroomIds[0])
                      : eq(schema.assignments.classroomId, classroomIds[0]),
                  ),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return allAssignments.map((a) => ({
            id: a.id,
            classroomId: a.classroomId,
            title: a.title,
            gameId: a.gameId,
            levelIds: parseStringArray(a.levelIds),
            dueDate: a.dueDate,
            classroomName: nameMap.get(a.classroomId) ?? '',
            completed: false,
          }))
        }),
    })),
  ),
)
