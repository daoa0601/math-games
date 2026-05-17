import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "apps/web/vitest.config.ts",
  "packages/core/vitest.config.ts",
  "packages/effect-classroom/vitest.config.ts",
  "packages/effect-game/vitest.config.ts",
  "packages/effect-infra/vitest.config.ts",
  "packages/game-magic-graph/vitest.config.ts",
  "packages/game-pattern-detective/vitest.config.ts",
  "packages/game-sequence-race/vitest.config.ts",
  "packages/game-shape-architect/vitest.config.ts",
  "packages/ui/vitest.config.ts",
]);
