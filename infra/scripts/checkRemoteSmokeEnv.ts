import "dotenv/config";

/* eslint-disable @typescript-eslint/no-unnecessary-condition -- CLI env and entrypoint checks depend on runtime process state */

import { pathToFileURL } from "node:url";

import { resolveRemoteWorkerBaseUrl } from "./resolveRemoteWorkerUrl";

interface RemoteSmokeEnvCliOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  log?: (message: string) => void;
  error?: (message: string) => void;
  rawRemoteUrl?: string;
}

export async function checkRemoteSmokeEnv(
  rawRemoteUrl = process.env.START_REMOTE_URL,
  {
    env = process.env,
    fetchImpl = fetch,
  }: Pick<RemoteSmokeEnvCliOptions, "env" | "fetchImpl"> = {},
) {
  const remoteUrl = await resolveRemoteWorkerBaseUrl({
    env,
    fetchImpl,
    rawRemoteUrl,
  });

  return `Remote Worker smoke target verified: ${remoteUrl.origin}`;
}

export async function runRemoteSmokeEnvCheck({
  env = process.env,
  fetchImpl = fetch,
  rawRemoteUrl = process.env.START_REMOTE_URL,
  log = console.log,
  error = console.error,
}: RemoteSmokeEnvCliOptions = {}) {
  try {
    log(await checkRemoteSmokeEnv(rawRemoteUrl, { env, fetchImpl }));

    return 0;
  } catch (caught) {
    error(caught instanceof Error ? caught.message : String(caught));

    return 1;
  }
}

function isMainModule() {
  const entrypoint = process.argv[1];

  return (
    entrypoint !== undefined &&
    import.meta.url === pathToFileURL(entrypoint).href
  );
}

if (isMainModule()) {
  process.exitCode = await runRemoteSmokeEnvCheck();
}
