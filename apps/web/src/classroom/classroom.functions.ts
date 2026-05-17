import { createServerFn } from '@tanstack/react-start'
import { Effect, Schema } from 'effect'

import { OriginGuardService, RateLimitService } from '@math-games/effect-infra'
import { PlayerIdentityService } from '@math-games/effect-game'
import {
  AssignmentService,
  ClassroomService,
} from '@math-games/effect-classroom'
import { runServerEffect } from '@/services/run-server-effect'

const CreateClassroomInput = Schema.Struct({
  name: Schema.NonEmptyString,
  gradeBand: Schema.optional(Schema.String),
  locale: Schema.optional(Schema.String),
})

const JoinClassroomInput = Schema.Struct({
  joinCode: Schema.NonEmptyString,
})

const CreateAssignmentInput = Schema.Struct({
  classroomId: Schema.NonEmptyString,
  title: Schema.NonEmptyString,
  gameId: Schema.NonEmptyString,
  levelIds: Schema.Array(Schema.NonEmptyString),
  dueDate: Schema.optional(Schema.String),
})

export const getMyClassrooms = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(
    Effect.gen(function* () {
      const classrooms = yield* ClassroomService
      return yield* classrooms.getMyClassrooms()
    }),
  ),
)

export const createClassroom = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(CreateClassroomInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* OriginGuardService).assert()
        const playerId = yield* (yield* PlayerIdentityService).resolveId()
        yield* (yield* RateLimitService).assert(`classroom:create:${playerId}`)

        const classrooms = yield* ClassroomService
        return yield* classrooms.create(data)
      }),
    ),
  )

export const joinClassroom = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(JoinClassroomInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* OriginGuardService).assert()
        const playerId = yield* (yield* PlayerIdentityService).resolveId()
        yield* (yield* RateLimitService).assert(`classroom:join:${playerId}`)

        const classrooms = yield* ClassroomService
        return yield* classrooms.join(data.joinCode)
      }),
    ),
  )

export const getClassroomMembers = createServerFn({ method: 'GET' })
  .inputValidator(
    Schema.decodeUnknownSync(
      Schema.Struct({ classroomId: Schema.NonEmptyString }),
    ),
  )
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const classrooms = yield* ClassroomService
        return yield* classrooms.getMembers(data.classroomId)
      }),
    ),
  )

export const getClassroomAssignments = createServerFn({ method: 'GET' })
  .inputValidator(
    Schema.decodeUnknownSync(
      Schema.Struct({ classroomId: Schema.NonEmptyString }),
    ),
  )
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const assignments = yield* AssignmentService
        return yield* assignments.getForClassroom(data.classroomId)
      }),
    ),
  )

export const createAssignment = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(CreateAssignmentInput))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        yield* (yield* OriginGuardService).assert()

        const assignments = yield* AssignmentService
        return yield* assignments.create(data)
      }),
    ),
  )

export const getMyAssignments = createServerFn({ method: 'GET' }).handler(() =>
  runServerEffect(
    Effect.gen(function* () {
      const assignments = yield* AssignmentService
      return yield* assignments.getForStudent()
    }),
  ),
)
