import { useEffect, useRef } from 'react'
import { useServerFn } from '@tanstack/react-start'

import { recordClientMetric } from '@/games/metrics.functions'

/**
 * Report a client metric. Best-effort: never throws, never blocks the caller.
 * Use from perf samplers, error boundaries, and usage events.
 */
export function useClientMetricReporter() {
  const record = useServerFn(recordClientMetric)
  const inflight = useRef(0)

  return function report(input: {
    kind: 'perf' | 'vitals' | 'error' | 'usage'
    name: string
    gameId?: string
    levelId?: string
    value?: number
    payloadJson?: string
  }) {
    // Coalesce if a previous report is still in flight — the sampler will
    // try again next tick.
    if (inflight.current > 0) return
    inflight.current += 1
    record({ data: input })
      .catch(() => {
        /* swallow — metrics are best-effort */
      })
      .finally(() => {
        inflight.current -= 1
      })
  }
}

/**
 * Throttled reporter for high-frequency samplers (e.g. the render-loop perf
 * monitor, which fires a snapshot every second). Emits at most once per
 * `intervalMs` and only when the sample crosses a meaningful threshold so
 * idle "0 fps" windows don't generate noise.
 */
export function useThrottledMetricReporter(options: {
  intervalMs?: number
  /** Skip a sample when this returns false. */
  shouldReport?: (value: number | undefined) => boolean
}) {
  const report = useClientMetricReporter()
  const intervalMs = options.intervalMs ?? 30_000
  const shouldReport = options.shouldReport ?? (() => true)
  const lastSent = useRef(0)

  return function reportThrottled(input: {
    kind: 'perf' | 'vitals' | 'error' | 'usage'
    name: string
    gameId?: string
    levelId?: string
    value?: number
    payloadJson?: string
  }) {
    const now = Date.now()
    if (now - lastSent.current < intervalMs) return
    if (!shouldReport(input.value)) return
    lastSent.current = now
    report(input)
  }
}

/**
 * Report a metric on unmount — useful for "session summary" payloads like
 * the median frame time across a play session.
 */
export function useReportMetricOnUnmount() {
  const report = useClientMetricReporter()
  const pending = useRef<Parameters<typeof report>[0] | null>(null)

  useEffect(() => {
    return () => {
      if (pending.current) report(pending.current)
    }
  }, [report])

  return function queueFinal(input: Parameters<typeof report>[0]) {
    pending.current = input
  }
}
