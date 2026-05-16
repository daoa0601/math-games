import { and, eq, sql } from 'drizzle-orm'
import { Context, Effect, Layer } from 'effect'

import { schema } from '@math-games/db'

import { AuthorizationError, ClassroomError, withD1Retry } from '@math-games/effect-infra'
import { DbService, PlayerIdentityService } from '@math-games/effect-game'

export interface Classroom {
  id: string
  name: string
  teacherPlayerId: string
  joinCode: string
  gradeBand: string | null
  locale: string | null
}

export interface ClassroomSummary {
  id: string
  name: string
  role: string
  memberCount: number
}

export interface ClassroomMembership {
  classroomId: string
  playerId: string
  role: string
}

export interface MemberWithProgress {
  playerId: string
  displayName: string
  role: string
  completedLevels: number
  totalAttempts: number
}

export interface ClassroomShape {
  readonly create: (input: {
    name: string
    gradeBand?: string
    locale?: string
  }) => Effect.Effect<Classroom, ClassroomError | AuthorizationError>

  readonly join: (
    joinCode: string,
  ) => Effect.Effect<ClassroomMembership, ClassroomError | AuthorizationError>

  readonly getMyClassrooms: () => Effect.Effect<
    ClassroomSummary[],
    ClassroomError | AuthorizationError
  >

  readonly getMembers: (
    classroomId: string,
  ) => Effect.Effect<
    MemberWithProgress[],
    ClassroomError | AuthorizationError
  >
}

export const ClassroomService =
  Context.Service<ClassroomShape>('ClassroomService')

function generateId(): string {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

export const ClassroomServiceLive = Layer.effect(
  ClassroomService,
  Effect.all([DbService, PlayerIdentityService]).pipe(
    Effect.map(([{ db }, identity]) => ({
      create: (input) =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()
          const id = generateId()
          const joinCode = generateJoinCode()

          const classroom: Classroom = {
            id,
            name: input.name,
            teacherPlayerId: playerId,
            joinCode,
            gradeBand: input.gradeBand ?? null,
            locale: input.locale ?? null,
          }

          yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db.batch([
                  db.insert(schema.classrooms).values({
                    id,
                    name: input.name,
                    teacherPlayerId: playerId,
                    joinCode,
                    gradeBand: input.gradeBand,
                    locale: input.locale,
                  }),
                  db.insert(schema.classroomMembers).values({
                    classroomId: id,
                    playerId,
                    role: 'teacher',
                  }),
                ]),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return classroom
        }),

      join: (joinCode) =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()

          const rows = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({ id: schema.classrooms.id })
                  .from(schema.classrooms)
                  .where(eq(schema.classrooms.joinCode, joinCode))
                  .limit(1),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          if (rows.length === 0) {
            return yield* new ClassroomError({
              cause: new Error('Invalid join code'),
            })
          }
          const classroom = rows[0]

          yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .insert(schema.classroomMembers)
                  .values({
                    classroomId: classroom.id,
                    playerId,
                    role: 'student',
                  })
                  .onConflictDoNothing(),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return {
            classroomId: classroom.id,
            playerId,
            role: 'student',
          }
        }),

      getMyClassrooms: () =>
        Effect.gen(function* () {
          const playerId = yield* identity.resolveId()

          const rows = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({
                    id: schema.classrooms.id,
                    name: schema.classrooms.name,
                    role: schema.classroomMembers.role,
                    memberCount:
                      sql<number>`(select count(*) from classroom_members where classroom_id = ${schema.classrooms.id})`,
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

          return rows
        }),

      getMembers: (classroomId) =>
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

          const members = yield* withD1Retry(
            Effect.tryPromise({
              try: () =>
                db
                  .select({
                    playerId: schema.classroomMembers.playerId,
                    displayName: schema.players.displayName,
                    role: schema.classroomMembers.role,
                    completedLevels:
                      sql<number>`coalesce((select count(*) from game_progress where player_id = ${schema.classroomMembers.playerId} and completed_at is not null), 0)`,
                    totalAttempts:
                      sql<number>`coalesce((select count(*) from game_attempts where player_id = ${schema.classroomMembers.playerId}), 0)`,
                  })
                  .from(schema.classroomMembers)
                  .innerJoin(
                    schema.players,
                    eq(schema.classroomMembers.playerId, schema.players.id),
                  )
                  .where(
                    eq(schema.classroomMembers.classroomId, classroomId),
                  ),
              catch: (cause) => new ClassroomError({ cause }),
            }),
          )

          return members
        }),
    })),
  ),
)
