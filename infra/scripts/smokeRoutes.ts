export interface SmokeRoute {
  path: string;
  expectedText: readonly string[];
}

export const gameRoutes: readonly SmokeRoute[] = [
  { path: "/games/magic-graph", expectedText: ["Magic"] },
  { path: "/games/sequence-race", expectedText: ["Race Line"] },
  { path: "/games/shape-architect", expectedText: ["Blueprint"] },
  { path: "/games/pattern-detective", expectedText: ["Pattern Detective"] },
  { path: "/games/fraction-builder", expectedText: ["Fraction"] },
  { path: "/games/equation-balance", expectedText: ["Equation"] },
];

export const blockedOldRootPaths = [
  "/magic-graph",
  "/sequence-race",
  "/shape-architect",
] as const;
