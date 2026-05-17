import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const dbBinding = "DB";
const requiredTables = [
  "players",
  "game_progress",
  "player_achievements",
  "daily_challenges",
] as const;
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

interface WranglerQueryResult {
  results?: Array<{ table_count?: number }>;
  success?: boolean;
}

function runWrangler(args: string[], capture = false) {
  const result = spawnSync(
    pnpmCommand,
    ["exec", "wrangler", "d1", ...args],
    capture
      ? {
          encoding: "utf8",
          env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
        }
      : { encoding: "utf8", stdio: "inherit" },
  );

  if (result.status !== 0) {
    const output = capture ? `${result.stdout}${result.stderr}`.trim() : "";

    throw new Error(output || `wrangler d1 ${args.join(" ")} failed`);
  }

  return result.stdout;
}

function parseWranglerJson(stdout: string) {
  const start = stdout.indexOf("[\n");
  const end = stdout.lastIndexOf("]");

  if (start === -1 || end === -1 || end < start) {
    throw new Error("Wrangler D1 output did not include a JSON result block.");
  }

  return JSON.parse(stdout.slice(start, end + 1)) as WranglerQueryResult[];
}

function localSchemaExists() {
  const tableNames = requiredTables.map((table) => `'${table}'`).join(",");
  const stdout = runWrangler(
    [
      "execute",
      dbBinding,
      "--local",
      "--command",
      `select count(*) as table_count from sqlite_master where type = 'table' and name in (${tableNames})`,
    ],
    true,
  );
  const [result] = parseWranglerJson(stdout);
  const tableCount = result.results?.[0]?.table_count;

  if (tableCount === undefined) {
    throw new Error("Wrangler D1 schema check did not return table_count.");
  }

  return tableCount === requiredTables.length;
}

function migrationFiles() {
  const fromCwd = join(process.cwd(), "drizzle", "migrations");
  const fromPackagesDb = join(
    process.cwd(),
    "packages",
    "db",
    "drizzle",
    "migrations",
  );
  const fromRelative = join(
    process.cwd(),
    "..",
    "..",
    "packages",
    "db",
    "drizzle",
    "migrations",
  );
  const migrationsRoot = existsSync(fromCwd)
    ? fromCwd
    : existsSync(fromPackagesDb)
      ? fromPackagesDb
      : fromRelative;

  return readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(migrationsRoot, entry.name, "migration.sql"))
    .filter((migrationPath) => existsSync(migrationPath))
    .sort();
}

export function ensureLocalD1() {
  if (localSchemaExists()) {
    console.log("Local D1 schema is ready.");

    return;
  }

  const files = migrationFiles();

  if (files.length === 0) {
    throw new Error("No Drizzle migration.sql files found.");
  }

  for (const file of files) {
    runWrangler(["execute", dbBinding, "--local", "--file", file]);
  }

  console.log(`Applied ${files.length} local D1 migration file(s).`);
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isMainModule()) {
  ensureLocalD1();
}
