// Emit ready-to-paste TS preset entries for 4 hard levels, sourced from the
// constructive generator with compactness + non-rectangle filters. The output
// is verified solvable and includes the target voxels + piece definitions.
//
// Run: corepack pnpm --filter @math-games/game-shape-architect exec \
//      tsx scripts/emit-hard-presets.ts > /tmp/hard-presets.ts

import { createSeededRandom } from "@math-games/core";
import { generateConstructivePuzzle } from "../src/logic/seeded-level-generator";
import { solvePuzzleDLX } from "../src/logic/dlx-solver";
import type { LevelConfig, Position3D } from "../src/logic/types";

function bbox(target: Position3D[]) {
  const xs = target.map((p) => p.x);
  const ys = target.map((p) => p.y);
  return {
    w: Math.max(...xs) - Math.min(...xs) + 1,
    h: Math.max(...ys) - Math.min(...ys) + 1,
  };
}

function convexity(target: Position3D[]): number {
  const { w, h } = bbox(target);
  return target.length / (w * h);
}

const NAMES = ["Crucible", "Outpost", "Cascade", "Bastion"];

const picked: LevelConfig[] = [];
const seen = new Set<string>();
for (let i = 0; i < 500 && picked.length < 4; i++) {
  const seed = `hard-preset-v2-${i}`;
  const level = generateConstructivePuzzle(createSeededRandom(seed), "hard");
  if (!level) continue;
  const { w, h } = bbox(level.targetVoxels);
  if (w > 9 || h > 8) continue;
  const conv = convexity(level.targetVoxels);
  if (conv > 0.78) continue; // require a clearly non-rectangular silhouette
  const key = `${w}x${h}:${conv.toFixed(2)}`;
  if (seen.has(key)) continue;
  seen.add(key);

  const result = solvePuzzleDLX(level, 8_000);
  if (!result.solvable) continue;
  // Reject too-easy (solver finds it instantly with <5 states) and too-hard
  // (timed out). Aim for the "thinking required" band.
  if (result.searchedStates < 4 || result.searchedStates > 200) continue;

  picked.push(level);
}

// Emit TS.
console.log("// Auto-generated hard preset levels. Replace hard_2 / hard_3 /");
console.log("// hard_4 and add one more. Each is verified solvable by the DLX");
console.log("// solver with non-trivial search effort.\n");

for (let i = 0; i < picked.length; i++) {
  const lvl = picked[i];
  const name = NAMES[i] ?? `Workshop ${i + 1}`;
  const id = `hard_v2_${i + 1}`;
  const { w, h } = bbox(lvl.targetVoxels);
  // Normalize target to start at (1,1).
  const minX = Math.min(...lvl.targetVoxels.map((p) => p.x));
  const minY = Math.min(...lvl.targetVoxels.map((p) => p.y));
  const normalized = lvl.targetVoxels.map((p) => ({
    x: p.x - minX + 1,
    y: p.y - minY + 1,
    z: 0,
  }));

  console.log(`{`);
  console.log(`  id: "${id}",`);
  console.log(`  name: "${name}",`);
  console.log(`  type: "2D",`);
  console.log(`  gridSize: [${w + 2}, ${h + 2}, 1],`);
  console.log(`  targetVoxels: [`);
  for (const v of normalized) {
    console.log(`    { x: ${v.x}, y: ${v.y}, z: 0 },`);
  }
  console.log(`  ],`);
  console.log(`  pieces: [`);
  for (const p of lvl.pieces) {
    console.log(
      `    { id: "${p.id}", name: "${p.name}", color: "${p.color}", layout: [`,
    );
    for (const c of p.layout) {
      console.log(`      { x: ${c.x}, y: ${c.y}, z: ${c.z} },`);
    }
    console.log(`    ] },`);
  }
  console.log(`  ],`);
  console.log(`  difficulty: "hard",`);
  console.log(`},`);
}
