import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";

import { AuthorizationError, ClassroomError } from "@math-games/effect-infra";
import { DbService, PlayerIdentityService } from "@math-games/effect-game";

import { ClassroomService, ClassroomServiceLive } from "../classroom";

function createHarness(opts: {
  playerId: string;
  dbBehavior: {
    batchResult?: unknown[][];
    selectResult?: unknown[];
    insertResult?: unknown;
  };
}) {
  let insertedBatches: unknown[][] = [];
  let insertedSingles: unknown[] = [];

  const identityLayer = Layer.succeed(PlayerIdentityService, {
    resolve: () =>
      Effect.succeed({
        id: opts.playerId,
        displayName: "Test Player",
        locale: "en" as const,
        gradeBand: "elementary" as const,
      }),
    resolveId: () => Effect.succeed(opts.playerId),
  });

  const dbLayer = Layer.succeed(DbService, {
    db: {
      batch: (stmts: unknown[]) => {
        insertedBatches.push(stmts);
        return Promise.resolve(opts.dbBehavior.batchResult ?? [[], []]);
      },
      insert: () => ({
        values: (vals: unknown) => {
          insertedSingles.push(vals);
          return {
            onConflictDoNothing: () => Promise.resolve(),
            onConflictDoUpdate: () => Promise.resolve(),
          };
        },
      }),
      select: () => {
        const chain = {
          from: () => chain,
          where: () => chain,
          innerJoin: () => chain,
          orderBy: () => chain,
          limit: () => Promise.resolve(opts.dbBehavior.selectResult ?? []),
          then: (resolve: (val: unknown[]) => void) =>
            resolve(opts.dbBehavior.selectResult ?? []),
        };
        return chain;
      },
    } as never,
  });

  const layer = ClassroomServiceLive.pipe(
    Layer.provide(Layer.mergeAll(identityLayer, dbLayer)),
  );

  return {
    layer,
    insertedBatches,
    insertedSingles,
  };
}

describe("ClassroomService.create", () => {
  it("returns a classroom with the teacher as creator", async () => {
    const { layer } = createHarness({
      playerId: "player-teacher-1",
      dbBehavior: {},
    });

    const classroom = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.create({ name: "Math 101" });
      }).pipe(Effect.provide(layer)),
    );

    expect(classroom.name).toBe("Math 101");
    expect(classroom.teacherPlayerId).toBe("player-teacher-1");
    expect(classroom.id).toBeTruthy();
    expect(classroom.joinCode).toBeTruthy();
    expect(classroom.joinCode.length).toBe(6);
  });

  it("populates optional gradeBand and locale", async () => {
    const { layer } = createHarness({
      playerId: "player-teacher-1",
      dbBehavior: {},
    });

    const classroom = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.create({
          name: "Toan Lop 6",
          gradeBand: "middle",
          locale: "vi",
        });
      }).pipe(Effect.provide(layer)),
    );

    expect(classroom.gradeBand).toBe("middle");
    expect(classroom.locale).toBe("vi");
  });

  it("defaults gradeBand and locale to null when omitted", async () => {
    const { layer } = createHarness({
      playerId: "player-teacher-1",
      dbBehavior: {},
    });

    const classroom = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.create({ name: "Basic Math" });
      }).pipe(Effect.provide(layer)),
    );

    expect(classroom.gradeBand).toBe(null);
    expect(classroom.locale).toBe(null);
  });
});

describe("ClassroomService.join", () => {
  it("joins with the student role when join code is valid", async () => {
    const { layer } = createHarness({
      playerId: "player-student-1",
      dbBehavior: {
        selectResult: [{ id: "classroom-abc" }],
      },
    });

    const membership = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.join("ABC123");
      }).pipe(Effect.provide(layer)),
    );

    expect(membership.classroomId).toBe("classroom-abc");
    expect(membership.playerId).toBe("player-student-1");
    expect(membership.role).toBe("student");
  });

  it("fails with ClassroomError when join code is invalid", async () => {
    const { layer } = createHarness({
      playerId: "player-student-1",
      dbBehavior: {
        selectResult: [],
      },
    });

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ClassroomService;
          return yield* service.join("INVALID");
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toBeInstanceOf(ClassroomError);
  });
});

describe("ClassroomService.getMyClassrooms", () => {
  it("returns classrooms the player belongs to", async () => {
    const { layer } = createHarness({
      playerId: "player-1",
      dbBehavior: {
        selectResult: [
          { id: "c1", name: "Math 101", role: "teacher", memberCount: 5 },
          { id: "c2", name: "Math 102", role: "student", memberCount: 12 },
        ],
      },
    });

    const classrooms = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.getMyClassrooms();
      }).pipe(Effect.provide(layer)),
    );

    expect(classrooms.length).toBe(2);
    expect(classrooms[0].name).toBe("Math 101");
    expect(classrooms[0].role).toBe("teacher");
    expect(classrooms[1].role).toBe("student");
  });

  it("returns an empty array when the player has no classrooms", async () => {
    const { layer } = createHarness({
      playerId: "player-lonely",
      dbBehavior: {
        selectResult: [],
      },
    });

    const classrooms = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* ClassroomService;
        return yield* service.getMyClassrooms();
      }).pipe(Effect.provide(layer)),
    );

    expect(classrooms).toEqual([]);
  });
});

describe("ClassroomService.getMembers", () => {
  it("rejects with AuthorizationError when caller is not a member", async () => {
    // First select (membership check) returns empty
    let callCount = 0;
    const identityLayer = Layer.succeed(PlayerIdentityService, {
      resolve: () =>
        Effect.succeed({
          id: "player-outsider",
          displayName: "Outsider",
          locale: "en" as const,
          gradeBand: "elementary" as const,
        }),
      resolveId: () => Effect.succeed("player-outsider"),
    });

    const dbLayer = Layer.succeed(DbService, {
      db: {
        select: () => {
          callCount++;
          const chain = {
            from: () => chain,
            where: () => chain,
            innerJoin: () => chain,
            orderBy: () => chain,
            limit: () => Promise.resolve([]),
            then: (resolve: (val: unknown[]) => void) => resolve([]),
          };
          return chain;
        },
      } as never,
    });

    const layer = ClassroomServiceLive.pipe(
      Layer.provide(Layer.mergeAll(identityLayer, dbLayer)),
    );

    await expect(
      Effect.runPromise(
        Effect.gen(function* () {
          const service = yield* ClassroomService;
          return yield* service.getMembers("classroom-secret");
        }).pipe(Effect.provide(layer)),
      ),
    ).rejects.toBeInstanceOf(AuthorizationError);
  });
});
