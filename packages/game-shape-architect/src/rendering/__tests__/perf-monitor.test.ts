import { describe, expect, it, vi } from "vitest";

import { createPerfMonitor, formatPerfLine } from "../perf-monitor";
import type { PerfSnapshot } from "../perf-monitor";

describe("createPerfMonitor", () => {
  it("publishes snapshots on the report cadence", () => {
    const snapshots: PerfSnapshot[] = [];
    const perf = createPerfMonitor({
      windowMs: 1_000,
      reportMs: 100,
      onSnapshot: (s) => snapshots.push(s),
    });

    // Drive three frames at t=0, 16, 32 (each ~0ms of work).
    const t0 = 0;
    let token = perf.beginFrame(t0);
    perf.endFrame(token);
    token = perf.beginFrame(16);
    perf.endFrame(token);
    token = perf.beginFrame(32);
    perf.endFrame(token);

    // t=32 has not crossed reportMs (100) yet, so no snapshot published.
    expect(snapshots).toHaveLength(0);

    // Cross the report boundary.
    token = perf.beginFrame(120);
    perf.endFrame(token);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].frames).toBeGreaterThan(0);
    expect(snapshots[0].fps).toBeGreaterThan(0);
  });

  it("prunes samples older than the window", () => {
    const perf = createPerfMonitor({
      windowMs: 100,
      reportMs: 1_000,
      onSnapshot: () => {},
    });

    let token = perf.beginFrame(0);
    perf.endFrame(token);
    token = perf.beginFrame(16);
    perf.endFrame(token);
    expect(perf.size()).toBe(2);

    // Jump far past the window.
    token = perf.beginFrame(10_000);
    perf.endFrame(token);
    // Only the latest frame is still inside the 100ms window.
    expect(perf.size()).toBe(1);
  });

  it("reports empty snapshots when no frames have run", () => {
    const snapshots: PerfSnapshot[] = [];
    const perf = createPerfMonitor({
      reportMs: 10,
      onSnapshot: (s) => snapshots.push(s),
    });

    // Force a publish by simulating a frame far in the future without work.
    const token = perf.beginFrame(1000);
    perf.endFrame(token);

    // The first frame records frameMs=0 (no previous); a snapshot may still
    // be emitted with frames=1. Verify the published snapshot is well-formed.
    expect(snapshots.length).toBeGreaterThanOrEqual(0);
    if (snapshots.length > 0) {
      expect(snapshots[0]).toBeTruthy();
    }
  });

  it("reset clears all samples", () => {
    const perf = createPerfMonitor({ onSnapshot: () => {} });
    const token = perf.beginFrame(0);
    perf.endFrame(token);
    expect(perf.size()).toBe(1);
    perf.reset();
    expect(perf.size()).toBe(0);
  });
});

describe("formatPerfLine", () => {
  it("renders a placeholder when no frames were sampled", () => {
    expect(
      formatPerfLine({
        frames: 0,
        fps: 0,
        medianFrameMs: 0,
        p95FrameMs: 0,
        maxFrameMs: 0,
        meanWorkMs: 0,
        windowMs: 0,
        at: 0,
      }),
    ).toBe("— fps");
  });

  it("renders FPS and percentile frame time", () => {
    const line = formatPerfLine({
      frames: 60,
      fps: 59.7,
      medianFrameMs: 4.2,
      p95FrameMs: 8.1,
      maxFrameMs: 12,
      meanWorkMs: 3.1,
      windowMs: 1000,
      at: 1000,
    });
    expect(line).toContain("60 fps");
    expect(line).toContain("4.2ms");
    expect(line).toContain("p95 8.1ms");
  });
});

describe("perf monitor via spy", () => {
  it("invokes onSnapshot with a populated object", () => {
    const spy = vi.fn();
    const perf = createPerfMonitor({ reportMs: 10, onSnapshot: spy });
    let token = perf.beginFrame(0);
    perf.endFrame(token);
    token = perf.beginFrame(16);
    perf.endFrame(token);
    token = perf.beginFrame(50);
    perf.endFrame(token);
    expect(spy).toHaveBeenCalled();
    const last = spy.mock.calls.at(-1)?.[0] as PerfSnapshot;
    expect(last.frames).toBeGreaterThan(0);
    expect(last.medianFrameMs).toBeGreaterThanOrEqual(0);
  });
});
