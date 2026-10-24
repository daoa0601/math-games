// ========================================
// Shape Architect — Solver + Generator Benchmark
// ========================================
//
// Run with:
//   corepack pnpm --filter @math-games/game-shape-architect exec \
//     tsx scripts/benchmark.ts
//
// Measures wall-clock times for:
//   1. DLX solve, backtrack solve, and solveLevelToSolution
//   2. Constructive level generation across difficulties
//
// Prints a markdown table. Re-run after each optimization to compare.
// The baseline numbers that motivated the buildRows anchor optimization
// are checked into docs/perf-benchmarks.md.

import { createSeededRandom } from "@math-games/core";
import { presetLevels } from "../src/logic/presets";
import { solvePuzzle } from "../src/logic/solver";
import { solvePuzzleDLX } from "../src/logic/dlx-solver";
import { generateGuaranteedSolvableWithRetry } from "../src/logic/seededGenerator";
import { solveLevelToSolution } from "../src/logic/solution";

interface Row {
  name: string;
  samples: number[];
}
const results: Row[] = [];

function measure(name: string, fn: () => void, runs = 5): void {
  const samples: number[] = [];
  // warmup
  fn();
  for (let i = 0; i < runs; i++) {
    const t0 = performance.now();
    fn();
    samples.push(performance.now() - t0);
  }
  results.push({ name, samples });
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function fmt(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// --- Preset levels: DLX vs backtrack vs canonical solution ---
for (const level of presetLevels) {
  measure(`DLX  ${level.id}`, () => solvePuzzleDLX(level, 30_000));
  measure(`BT   ${level.id}`, () => solvePuzzle(level, 30_000));
  measure(`SLN  ${level.id}`, () =>
    solveLevelToSolution(level, { maxTimeMs: 30_000 }),
  );
}

// --- Constructive generator across difficulties ---
for (const difficulty of [
  "easy",
  "medium",
  "hard",
  "expert",
  "master",
] as const) {
  measure(
    `GEN  ${difficulty}`,
    () =>
      generateGuaranteedSolvableWithRetry(
        createSeededRandom(`bench-${difficulty}`),
        difficulty,
      ),
    3,
  );
}

// --- Markdown report ---
const nameWidth = Math.max(...results.map((r) => r.name.length));
console.log();
console.log(`| ${"bench".padEnd(nameWidth)} | median   | min      | runs |`);
console.log(`| ${"-".repeat(nameWidth)} | -------- | -------- | ---- |`);
for (const r of results) {
  const med = median(r.samples);
  const min = Math.min(...r.samples);
  console.log(
    `| ${r.name.padEnd(nameWidth)} | ${fmt(med).padStart(8)} | ${fmt(min).padStart(8)} | ${r.samples.length.toString().padStart(4)} |`,
  );
}
console.log();
