import { createServerFn } from '@tanstack/react-start'
import { Effect, Schema } from 'effect'

import { ClientMetricsService } from '@math-games/effect-game'

import { runServerEffect } from '@/services/run-server-effect'

/**
 * Client-side perf/health metric ingest. Browser-side samplers (the
 * shape-architect render-loop perf monitor, web-vitals, future error
 * reporters) post a single row per snapshot; the server fans them out to
 * the `client_metrics` D1 table.
 *
 * Batched at the call site (every ~30s) so this stays cheap.
 */
const ClientMetricRequest = Schema.Struct({
  kind: Schema.Literals(['perf', 'vitals', 'error', 'usage']),
  name: Schema.String.check(Schema.isMinLength(1)).check(
    Schema.isMaxLength(128),
  ),
  gameId: Schema.UndefinedOr(Schema.String.check(Schema.isMaxLength(64))),
  levelId: Schema.UndefinedOr(Schema.String.check(Schema.isMaxLength(128))),
  value: Schema.UndefinedOr(Schema.Number),
  // Cap payload at 4KB so a runaway sampler can't bloat D1.
  payloadJson: Schema.UndefinedOr(
    Schema.String.check(Schema.isMaxLength(4096)),
  ),
})

export const recordClientMetric = createServerFn({ method: 'POST' })
  .inputValidator(Schema.decodeUnknownSync(ClientMetricRequest))
  .handler(({ data }) =>
    runServerEffect(
      Effect.gen(function* () {
        const metrics = yield* ClientMetricsService
        yield* metrics.record(data)
        return { ok: true as const }
      }),
    ),
  )
