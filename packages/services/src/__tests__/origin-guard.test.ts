import { Effect, Layer } from 'effect'
import { describe, expect, it } from 'vitest'

import {
  CrossOriginError,
  HeaderService,
  OriginGuardService,
  OriginGuardServiceLive,
} from '../index'

function runGuard(headers: Record<string, string>) {
  const headerLayer = Layer.succeed(HeaderService, {
    getRequest: (name: string) => Effect.succeed(headers[name] ?? null),
    setResponse: () => Effect.void,
  })

  return Effect.runPromise(
    Effect.gen(function* () {
      yield* (yield* OriginGuardService).assert()
    }).pipe(
      Effect.provide(OriginGuardServiceLive.pipe(Layer.provide(headerLayer))),
    ),
  )
}

describe('OriginGuardService', () => {
  it('allows same-origin requests', async () => {
    await expect(
      runGuard({ 'sec-fetch-site': 'same-origin' }),
    ).resolves.toBeUndefined()
  })

  it('allows same-site requests', async () => {
    await expect(
      runGuard({ 'sec-fetch-site': 'same-site' }),
    ).resolves.toBeUndefined()
  })

  it('rejects cross-site requests', async () => {
    await expect(
      runGuard({ 'sec-fetch-site': 'cross-site' }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('rejects cross-origin requests', async () => {
    await expect(
      runGuard({ 'sec-fetch-site': 'cross-origin' }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('falls back to Origin/Host when sec-fetch-site is absent', async () => {
    await expect(
      runGuard({ origin: 'https://example.com', host: 'example.com' }),
    ).resolves.toBeUndefined()
  })

  it('rejects when Origin and Host mismatch', async () => {
    await expect(
      runGuard({ origin: 'https://evil.com', host: 'example.com' }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('rejects when Origin header is missing', async () => {
    await expect(runGuard({ host: 'example.com' })).rejects.toBeInstanceOf(
      CrossOriginError,
    )
  })

  it('rejects when Host header is missing', async () => {
    await expect(
      runGuard({ origin: 'https://example.com' }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('rejects when both Origin and Host are missing', async () => {
    await expect(runGuard({})).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('rejects malformed Origin header', async () => {
    await expect(
      runGuard({ origin: 'not-a-url', host: 'example.com' }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })

  it('matches Origin with non-default port against Host', async () => {
    await expect(
      runGuard({
        origin: 'https://example.com:8443',
        host: 'example.com:8443',
      }),
    ).resolves.toBeUndefined()
  })

  it('rejects Origin with port mismatch', async () => {
    await expect(
      runGuard({
        origin: 'https://example.com:8443',
        host: 'example.com',
      }),
    ).rejects.toBeInstanceOf(CrossOriginError)
  })
})
