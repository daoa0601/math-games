import "dotenv/config";

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- deploy runner checks runtime env, but generated Worker env types make some keys look static */

import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const hasValue = (value: string | undefined) =>
  typeof value === "string" && value.trim() !== "";

export interface AlchemyRunnerEnv {
  [key: string]: string | undefined;
  ALCHEMY_DEPLOY?: string;
  CI?: string;
  CLOUDFLARE_ACCOUNT_ID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

export interface AlchemySpawnResult {
  error?: Error;
  signal?: NodeJS.Signals | null;
  status: number | null;
}

export type AlchemySpawn = (
  command: string,
  args: string[],
  options: {
    env: Record<string, string | undefined>;
    stdio: "inherit";
  },
) => AlchemySpawnResult;

export interface RunAlchemyOptions {
  env?: AlchemyRunnerEnv;
  spawn?: AlchemySpawn;
}

export function usesScopedTokenAuth(env: AlchemyRunnerEnv) {
  return (
    hasValue(env.CLOUDFLARE_ACCOUNT_ID) && hasValue(env.CLOUDFLARE_API_TOKEN)
  );
}

export function createAlchemyEnvironment(env: AlchemyRunnerEnv) {
  return {
    ...env,
    ALCHEMY_DEPLOY: "1",
    CI: usesScopedTokenAuth(env) ? "true" : env.CI,
  };
}

function includesYesFlag(args: string[]) {
  return args.includes("--yes") || args.includes("-y");
}

export function normalizeAlchemyArgs(args: string[], env: AlchemyRunnerEnv) {
  if (
    args[0] !== "deploy" ||
    !usesScopedTokenAuth(env) ||
    includesYesFlag(args)
  ) {
    return args;
  }

  return ["deploy", "--yes", ...args.slice(1)];
}

function defaultSpawnAlchemy(
  command: string,
  args: string[],
  options: {
    env: Record<string, string | undefined>;
    stdio: "inherit";
  },
) {
  return spawnSync(command, args, {
    env: options.env as NodeJS.ProcessEnv,
    stdio: options.stdio,
  });
}

export function runAlchemyCommand(
  args: string[],
  { env = process.env, spawn = defaultSpawnAlchemy }: RunAlchemyOptions = {},
) {
  if (args.length === 0) {
    console.error("Usage: tsx scripts/runAlchemy.ts <alchemy args...>");
    return 1;
  }

  const alchemyEnv = createAlchemyEnvironment(env);
  const normalizedArgs = normalizeAlchemyArgs(args, env);

  const result = spawn("alchemy", normalizedArgs, {
    env: alchemyEnv,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    return 1;
  }

  if (result.signal) {
    console.error(`Alchemy exited after signal ${result.signal}.`);
    return 1;
  }

  return result.status ?? 1;
}

function isMainModule() {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isMainModule()) {
  process.exitCode = runAlchemyCommand(process.argv.slice(2));
}
