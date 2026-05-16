import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import { DbService } from '@math-games/effect-game'

import { AccountLinkService, AccountLinkServiceLive } from '../account-link'

function createHarness(opts: {
  selectResult?: unknown[]
  updateTracker?: Array<Record<string, unknown>>
}) {
  let insertedValues: unknown[] = []
  const updateTracker = opts.updateTracker ?? []

  const dbLayer = Layer.succeed(DbService, {
    db: {
      insert: () => ({
        values: (vals: unknown) => {
          insertedValues.push(vals)
          return {
            onConflictDoUpdate: () => Promise.resolve(),
          }
        },
      }),
      select: () => {
        const chain = {
          from: () => chain,
          where: () => chain,
          limit: () => Promise.resolve(opts.selectResult ?? []),
        }
        return chain
      },
      update: () => ({
        set: (vals: Record<string, unknown>) => {
          updateTracker.push(vals)
          return {
            where: () => Promise.resolve(),
          }
        },
      }),
    } as never,
  })

  const layer = AccountLinkServiceLive.pipe(Layer.provide(dbLayer))

  return { layer, insertedValues, updateTracker }
}

describe('AccountLinkService.requestLink', () => {
  it('returns a token string', async () => {
    const { layer } = createHarness({})

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.requestLink('player-1', 'test@example.com')
      }).pipe(Effect.provide(layer)),
    )

    expect(typeof result.token).toBe('string')
    expect(result.token.length).toBe(64) // 32 bytes hex-encoded
  })

  it('produces different tokens on consecutive calls', async () => {
    const { layer } = createHarness({})

    const [first, second] = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        const a = yield* service.requestLink('player-1', 'a@test.com')
        const b = yield* service.requestLink('player-1', 'b@test.com')
        return [a, b]
      }).pipe(Effect.provide(layer)),
    )

    expect(first.token).not.toBe(second.token)
  })
})

describe('AccountLinkService.verifyLink', () => {
  it('returns the playerId for a valid, non-expired token', async () => {
    const futureExpiry = new Date(Date.now() + 3600_000)
    const updateTracker: Array<Record<string, unknown>> = []
    const { layer } = createHarness({
      selectResult: [
        { playerId: 'player-verified', tokenExpiresAt: futureExpiry },
      ],
      updateTracker,
    })

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.verifyLink('valid-token-hex')
      }).pipe(Effect.provide(layer)),
    )

    expect(result).not.toBe(null)
    expect(result!.playerId).toBe('player-verified')
    // Token should be cleared after verification
    expect(updateTracker.length).toBe(1)
    expect(updateTracker[0].magicLinkToken).toBe(null)
  })

  it('returns null for an unknown token', async () => {
    const { layer } = createHarness({
      selectResult: [],
    })

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.verifyLink('nonexistent-token')
      }).pipe(Effect.provide(layer)),
    )

    expect(result).toBe(null)
  })

  it('returns null for an expired token', async () => {
    const pastExpiry = new Date(Date.now() - 1000)
    const { layer } = createHarness({
      selectResult: [
        { playerId: 'player-expired', tokenExpiresAt: pastExpiry },
      ],
    })

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.verifyLink('expired-token')
      }).pipe(Effect.provide(layer)),
    )

    expect(result).toBe(null)
  })
})

describe('AccountLinkService.resolveByEmail', () => {
  it('returns the playerId when the email has a link', async () => {
    const { layer } = createHarness({
      selectResult: [{ playerId: 'player-linked' }],
    })

    const playerId = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.resolveByEmail('linked@example.com')
      }).pipe(Effect.provide(layer)),
    )

    expect(playerId).toBe('player-linked')
  })

  it('returns null when the email has no link', async () => {
    const { layer } = createHarness({
      selectResult: [],
    })

    const playerId = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* AccountLinkService
        return yield* service.resolveByEmail('unknown@example.com')
      }).pipe(Effect.provide(layer)),
    )

    expect(playerId).toBe(null)
  })
})
