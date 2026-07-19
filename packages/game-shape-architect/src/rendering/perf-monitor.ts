// ========================================
// Shape Architect — Render-loop performance monitor (pure)
// ========================================
//
// A small, framework-free frame sampler that any rAF loop (three-scene,
// the 2D canvas, future games) can feed. Collects frame times, derives FPS
// / frame-time percentiles, and exposes a snapshot for an on-screen HUD or
// a downstream analytics ingest. Pure TS — no THREE, no React, no DOM.

export interface FrameSample {
  /** Wall-clock frame time in milliseconds (rAF-to-rAF delta). */
  frameMs: number;
  /** Time spent inside render/update work this frame, in ms. */
  workMs: number;
  /** Monotonic timestamp (performance.now()) the sample was recorded. */
  at: number;
}

export interface PerfSnapshot {
  /** Frames sampled in the last reporting window. */
  frames: number;
  /** Mean FPS across the window (frames / wallSeconds). */
  fps: number;
  /** Median frame time in ms. */
  medianFrameMs: number;
  /** 95th-percentile frame time in ms (jank tail). */
  p95FrameMs: number;
  /** Worst frame time in ms this window. */
  maxFrameMs: number;
  /** Mean render work per frame in ms. */
  meanWorkMs: number;
  /** Wall-clock duration of the window, in ms. */
  windowMs: number;
  /** Snapshot timestamp (performance.now()). */
  at: number;
}

export interface PerfMonitorOptions {
  /** How long to keep samples for the rolling window, in ms. Default 2000. */
  windowMs?: number;
  /** Called whenever a new snapshot is published (every ~reportMs). */
  onSnapshot?: (snapshot: PerfSnapshot) => void;
  /** Snapshot cadence in ms. Default 1000. */
  reportMs?: number;
}

/**
 * A rolling-window frame sampler. Use one per render loop:
 *
 * ```ts
 * const perf = createPerfMonitor({ onSnapshot: setHud });
 * function frame(now: number) {
 *   const token = perf.beginFrame(now);
 *   ... do render work ...
 *   perf.endFrame(token);
 *   requestAnimationFrame(frame);
 * }
 * ```
 */
export function createPerfMonitor(options: PerfMonitorOptions = {}) {
  const windowMs = options.windowMs ?? 2_000;
  const reportMs = options.reportMs ?? 1_000;
  const onSnapshot = options.onSnapshot;

  const samples: FrameSample[] = [];
  let lastReport = 0;
  let lastFrameTime = 0;

  function prune(now: number): void {
    const cutoff = now - windowMs;
    // Samples are pushed in order, so we can splice the prefix off in bulk.
    let firstValid = 0;
    for (let i = 0; i < samples.length; i++) {
      if (samples[i].at >= cutoff) break;
      firstValid = i + 1;
    }
    if (firstValid > 0) samples.splice(0, firstValid);
  }

  function percentile(sortedAsc: number[], p: number): number {
    if (sortedAsc.length === 0) return 0;
    const idx = Math.min(
      sortedAsc.length - 1,
      Math.ceil((p / 100) * sortedAsc.length) - 1,
    );
    return sortedAsc[Math.max(0, idx)];
  }

  function publish(now: number): void {
    if (!onSnapshot) return;
    if (samples.length === 0) {
      onSnapshot({
        frames: 0,
        fps: 0,
        medianFrameMs: 0,
        p95FrameMs: 0,
        maxFrameMs: 0,
        meanWorkMs: 0,
        windowMs: 0,
        at: now,
      });
      return;
    }
    const first = samples[0];
    const last = samples[samples.length - 1];
    const windowDuration = last.at - first.at;
    const frameTimes = samples.map((s) => s.frameMs);
    const sorted = [...frameTimes].sort((a, b) => a - b);
    const totalWork = samples.reduce((sum, s) => sum + s.workMs, 0);

    onSnapshot({
      frames: samples.length,
      fps: windowDuration > 0 ? (samples.length / windowDuration) * 1000 : 0,
      medianFrameMs: percentile(sorted, 50),
      p95FrameMs: percentile(sorted, 95),
      maxFrameMs: sorted[sorted.length - 1],
      meanWorkMs: totalWork / samples.length,
      windowMs: windowDuration,
      at: now,
    });
  }

  return {
    /** Begin a frame. Returns a token to pass to {@link endFrame}. */
    beginFrame(now: number): { start: number; frameMs: number } {
      const frameMs = lastFrameTime > 0 ? now - lastFrameTime : 0;
      lastFrameTime = now;
      return { start: now, frameMs };
    },

    /** End a frame and record the sample. */
    endFrame(token: { start: number; frameMs: number }): void {
      const now = token.start;
      const workMs = performance.now() - token.start;
      samples.push({ frameMs: token.frameMs, workMs, at: now });

      prune(now);
      if (now - lastReport >= reportMs) {
        lastReport = now;
        publish(now);
      }
    },

    /** Current sample count (for tests). */
    size(): number {
      return samples.length;
    },

    /** Reset all state (e.g. when the scene is re-fitted). */
    reset(): void {
      samples.length = 0;
      lastReport = 0;
      lastFrameTime = 0;
    },
  };
}

export type PerfMonitor = ReturnType<typeof createPerfMonitor>;

/**
 * Format a snapshot for a HUD line. Returns e.g. `"60 fps · 4ms (p95 8ms)"`.
 */
export function formatPerfLine(s: PerfSnapshot): string {
  if (s.frames === 0) return "— fps";
  return `${Math.round(s.fps)} fps · ${s.medianFrameMs.toFixed(1)}ms (p95 ${s.p95FrameMs.toFixed(1)}ms)`;
}
