// ========================================
// Magic Graph - Puzzle Structure Validator
// ========================================

import type { PuzzleConfig } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates puzzle structure before adding to templates
 * Ensures all lines have exactly 3 nodes and all references are valid
 */
export function validatePuzzleStructure(
  puzzle: Omit<PuzzleConfig, "id"> & { id?: string },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeIds = new Set(puzzle.nodes.map((n) => n.id));
  const puzzleName = puzzle.name || puzzle.id || "Unknown";

  // Check: All lines must have exactly 3 nodes
  puzzle.lines.forEach((line, i) => {
    if (line.nodeIds.length !== 3) {
      errors.push(
        `${puzzleName}: Line ${i + 1} (${line.id}) has ${line.nodeIds.length} nodes, expected exactly 3`,
      );
    }

    // Check: No duplicate nodes in a single line
    const uniqueNodes = new Set(line.nodeIds);
    if (uniqueNodes.size !== line.nodeIds.length) {
      errors.push(
        `${puzzleName}: Line ${i + 1} (${line.id}) has duplicate node references`,
      );
    }

    // Check: All node IDs in lines must exist
    line.nodeIds.forEach((nodeId) => {
      if (!nodeIds.has(nodeId)) {
        errors.push(
          `${puzzleName}: Line ${i + 1} (${line.id}) references non-existent node: ${nodeId}`,
        );
      }
    });
  });

  // Check: Node count matches available numbers count
  if (puzzle.nodes.length !== puzzle.availableNumbers.length) {
    warnings.push(
      `${puzzleName}: Node count (${puzzle.nodes.length}) doesn't match available numbers count (${puzzle.availableNumbers.length})`,
    );
  }

  // Check: Target sum is mathematically possible
  const minSum = Math.min(...puzzle.availableNumbers);
  const maxSum = Math.max(...puzzle.availableNumbers);
  const minPossible = minSum * 3;
  const maxPossible = maxSum * 3;

  if (puzzle.targetSum < minPossible || puzzle.targetSum > maxPossible) {
    errors.push(
      `${puzzleName}: Target sum ${puzzle.targetSum} is outside possible range [${minPossible}, ${maxPossible}]`,
    );
  }

  // Check: All nodes are referenced in at least one line
  const referencedNodes = new Set<string>();
  puzzle.lines.forEach((line) => {
    line.nodeIds.forEach((nodeId) => referencedNodes.add(nodeId));
  });

  puzzle.nodes.forEach((node) => {
    if (!referencedNodes.has(node.id)) {
      warnings.push(
        `${puzzleName}: Node ${node.id} is not referenced in any line`,
      );
    }
  });

  // Check: No negative positions
  puzzle.nodes.forEach((node) => {
    if (node.position.x < 0 || node.position.y < 0) {
      warnings.push(
        `${puzzleName}: Node ${node.id} has negative position (${node.position.x}, ${node.position.y})`,
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple puzzles and returns a summary
 */
export function validatePuzzles(
  puzzles: Array<Omit<PuzzleConfig, "id"> & { id?: string; name: string }>,
): {
  allValid: boolean;
  results: Map<string, ValidationResult>;
  totalErrors: number;
  totalWarnings: number;
} {
  const results = new Map<string, ValidationResult>();
  let totalErrors = 0;
  let totalWarnings = 0;

  puzzles.forEach((puzzle) => {
    const result = validatePuzzleStructure(puzzle);
    results.set(puzzle.name, result);
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
  });

  return {
    allValid: totalErrors === 0,
    results,
    totalErrors,
    totalWarnings,
  };
}

/**
 * Checks if a line arrangement can potentially have a valid solution
 * This is a quick heuristic check, not a full solver
 */
export function checkLineArrangement(puzzle: Omit<PuzzleConfig, "id">): {
  feasible: boolean;
  reason?: string;
} {
  const { lines, targetSum, availableNumbers } = puzzle;

  // Check if all lines have the same node count
  const nodeCounts = lines.map((l) => l.nodeIds.length);
  const uniqueCounts = new Set(nodeCounts);

  if (uniqueCounts.size > 1) {
    return {
      feasible: false,
      reason: `Lines have different node counts: ${Array.from(uniqueCounts).join(", ")}. All lines must have exactly 3 nodes.`,
    };
  }

  // Check if target sum is achievable with 3 numbers from available pool
  const nums = [...availableNumbers].sort((a, b) => a - b);
  const minThreeSum = nums.slice(0, 3).reduce((a, b) => a + b, 0);
  const maxThreeSum = nums.slice(-3).reduce((a, b) => a + b, 0);

  if (targetSum < minThreeSum || targetSum > maxThreeSum) {
    return {
      feasible: false,
      reason: `Target sum ${targetSum} cannot be achieved with any 3 numbers from [${nums.join(", ")}]`,
    };
  }

  return { feasible: true };
}
