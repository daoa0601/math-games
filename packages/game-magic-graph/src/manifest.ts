import type { LevelManifest, SolutionStep } from "@math-games/core";

import { solve } from "./logic/solver";
import type { Line, PuzzleConfig } from "./logic/types";

const GENERATOR_VERSION = "magic-graph-2026.05.1";

const MAGIC_GRAPH_SKILLS = [
  "constraint_propagation",
  "additive_structure",
] as const;

const MAGIC_GRAPH_MISCONCEPTIONS = ["ignores_cross_line_constraints"] as const;

interface ForcedCell {
  nodeId: string;
  value: number;
  lineId: string;
}

/**
 * A cell is forced when a line has exactly one remaining unknown node: its value
 * is `targetSum - (sum of the line's known nodes)`. We only accept the deduction
 * if it matches the global solution, which keeps multi-line puzzles consistent.
 */
function findForcedCell(
  lines: readonly Line[],
  known: ReadonlyMap<string, number>,
  targetSum: number,
  target: ReadonlyMap<string, number>,
): ForcedCell | null {
  for (const line of lines) {
    const unknowns = line.nodeIds.filter((id) => !known.has(id));
    if (unknowns.length !== 1) continue;

    const nodeId = unknowns[0];
    const sumKnown = line.nodeIds.reduce(
      (sum, id) => sum + (known.get(id) ?? 0),
      0,
    );
    const value = targetSum - sumKnown;
    if (target.get(nodeId) === value) {
      return { nodeId, value, lineId: line.id };
    }
  }
  return null;
}

/**
 * Turn the solver's answer into an ordered, localizable trace: prefer forced
 * single-cell deductions, falling back to placing the next solution value when
 * no cell is forced yet. Returns [] when the puzzle has no solution (e.g. the
 * intentionally unsolvable practice puzzles). Steps are keyed (labelKey + params)
 * so item logic stays string-free; `data` carries the placement for replay.
 */
export function deriveSolutionTrace(config: PuzzleConfig): SolutionStep[] {
  const solutions = solve(
    config.nodes,
    config.lines,
    config.availableNumbers,
    config.targetSum,
    1,
  );
  if (solutions.length === 0) return [];
  const solution = solutions[0];

  const target = new Map<string, number>();
  const known = new Map<string, number>();
  for (const node of config.nodes) {
    if (node.isFixed && node.value !== null) {
      target.set(node.id, node.value);
      known.set(node.id, node.value);
    } else {
      const value = solution.get(node.id);
      if (value !== undefined) target.set(node.id, value);
    }
  }

  const remaining = config.nodes
    .filter((node) => !known.has(node.id))
    .map((node) => node.id);

  const steps: SolutionStep[] = [];
  while (remaining.length > 0) {
    const forced = findForcedCell(
      config.lines,
      known,
      config.targetSum,
      target,
    );
    if (forced) {
      steps.push({
        labelKey: "trace.forcedCell",
        params: {
          node: forced.nodeId,
          value: forced.value,
          target: config.targetSum,
        },
        data: {
          nodeId: forced.nodeId,
          value: forced.value,
          lineId: forced.lineId,
        },
      });
      known.set(forced.nodeId, forced.value);
      remaining.splice(remaining.indexOf(forced.nodeId), 1);
      continue;
    }

    const nodeId = remaining[0];
    const value = target.get(nodeId);
    if (value === undefined) break; // unreachable for a solvable puzzle
    steps.push({
      labelKey: "trace.placeValue",
      params: { node: nodeId, value },
      data: { nodeId, value },
    });
    known.set(nodeId, value);
    remaining.shift();
  }

  return steps;
}

function countSharedNodes(config: PuzzleConfig): number {
  return config.nodes.filter(
    (node) =>
      config.lines.filter((line) => line.nodeIds.includes(node.id)).length > 1,
  ).length;
}

/**
 * Build the pedagogical manifest for a magic-graph level: the skills and
 * misconception it exercises, structural difficulty features read off the
 * config, and a solver-derived (server-only) solution trace.
 */
export function buildMagicGraphManifest(
  config: PuzzleConfig,
  seed?: string,
): LevelManifest {
  const solutionTrace = deriveSolutionTrace(config);
  const maxLineLength = config.lines.reduce(
    (max, line) => Math.max(max, line.nodeIds.length),
    0,
  );

  return {
    skillTags: [...MAGIC_GRAPH_SKILLS],
    misconceptionTags: [...MAGIC_GRAPH_MISCONCEPTIONS],
    difficultyFeatures: {
      lineCount: config.lines.length,
      nodeCount: config.nodes.length,
      emptyNodeCount: config.nodes.filter((node) => !node.isFixed).length,
      availableNumberCount: config.availableNumbers.length,
      targetSum: config.targetSum,
      maxLineLength,
      sharedNodeCount: countSharedNodes(config),
      isSolvable: config.isSolvable ?? true,
    },
    gradeBand: "middle",
    gameId: "magic-graph",
    generatorVersion: GENERATOR_VERSION,
    ...(seed ? { seed } : {}),
    ...(solutionTrace.length > 0 ? { solutionTrace } : {}),
  };
}
