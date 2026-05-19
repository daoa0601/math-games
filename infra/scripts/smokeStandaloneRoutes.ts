import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { gameRoutes, blockedOldRootPaths } from "./smokeRoutes";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = join(scriptDir, "..");
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://localhost:3000";

interface RouteSmokeCheck {
  path: string;
  expectedText: readonly string[];
}

const standaloneRoutes: RouteSmokeCheck[] = [
  {
    path: "/",
    expectedText: ["Practice Dashboard", "Daily Challenge"],
  },
  {
    path: "/daily",
    expectedText: ["Daily Challenge", "Play Today"],
  },
  {
    path: "/profile",
    expectedText: ["Player Profile", "Progress Snapshot"],
  },
  ...gameRoutes,
];

const blockedRootGameRoutes = blockedOldRootPaths;

const oldRootRouteFiles = [
  "src/routes/magic-graph.tsx",
  "src/routes/sequence-race.tsx",
  "src/routes/shape-architect.tsx",
];

const oldRootGeneratedRouteEntries = [
  "path: '/magic-graph'",
  "path: '/sequence-race'",
  "path: '/shape-architect'",
  "'/magic-graph':",
  "'/sequence-race':",
  "'/shape-architect':",
];

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function routeUrl(path: string) {
  const url = new URL(path, baseUrl);
  return url.toString();
}

async function smokeRoute(check: RouteSmokeCheck) {
  const response = await fetch(routeUrl(check.path), {
    redirect: "manual",
  });

  assert(
    response.status === 200,
    `${check.path} returned ${response.status}; expected 200`,
  );

  const body = await response.text();

  for (const expected of check.expectedText) {
    assert(
      body.includes(expected),
      `${check.path} did not include expected text: ${expected}`,
    );
  }
}

async function smokeBlockedRoute(path: string) {
  const response = await fetch(routeUrl(path), {
    redirect: "manual",
  });

  assert(
    response.status === 404,
    `Old root game route ${path} returned ${response.status}; expected 404 not found instead of being served or redirected`,
  );
}

function smokeRouteTree() {
  for (const oldRootRouteFile of oldRootRouteFiles) {
    assert(
      !existsSync(join(appRoot, oldRootRouteFile)),
      `Old root game route file still exists: ${oldRootRouteFile}`,
    );
  }

  const routeTree = readFileSync(
    join(appRoot, "src", "routeTree.gen.ts"),
    "utf8",
  );

  for (const entry of oldRootGeneratedRouteEntries) {
    assert(
      !routeTree.includes(entry),
      `Generated route tree still contains old root game entry: ${entry}`,
    );
  }
}

smokeRouteTree();

for (const check of standaloneRoutes) {
  await smokeRoute(check);
}

for (const path of blockedRootGameRoutes) {
  await smokeBlockedRoute(path);
}

console.log(
  `Standalone route smoke passed for ${standaloneRoutes.length} routes and ${blockedRootGameRoutes.length} rejected old root game routes at ${baseUrl}.`,
);
