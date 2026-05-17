import { isIP } from "node:net";

export const defaultWorkerName = "math-games";
export const remoteSmokeCompletionProof =
  "Remote smoke verifies standalone routes, rejected old root game paths, D1-backed profile state, mg_player, and D1-backed daily challenge row.";

interface CloudflareApiEnvelope<TResult> {
  success?: boolean;
  errors?: Array<{
    message?: string;
  }>;
  result?: TResult;
}

interface AccountSubdomainResult {
  subdomain?: string;
}

interface WorkerSubdomainResult {
  enabled?: boolean;
}

export interface ResolveRemoteWorkerUrlOptions {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
  rawRemoteUrl?: string;
  workerName?: string;
}

function fail(message: string): never {
  throw new Error(message);
}

function hasValue(value: string | undefined): value is string {
  return value !== undefined && value.trim() !== "";
}

function normalizeRemoteUrl(rawRemoteUrl: string) {
  const remoteUrl = new URL(rawRemoteUrl.trim());

  if (remoteUrl.protocol !== "https:") {
    fail("START_REMOTE_URL must use an HTTPS origin.");
  }

  if (isIpLiteral(remoteUrl.hostname)) {
    fail(
      "START_REMOTE_URL must point to a deployed Cloudflare Worker origin by hostname, not an IP address.",
    );
  }

  if (isLocalOrPrivateHost(remoteUrl.hostname)) {
    fail(
      "START_REMOTE_URL must point to a deployed Cloudflare Worker origin, not a local or private network host.",
    );
  }

  if (remoteUrl.port !== "") {
    fail("START_REMOTE_URL must use the default HTTPS port.");
  }

  if (
    remoteUrl.pathname !== "/" ||
    remoteUrl.search !== "" ||
    remoteUrl.hash !== ""
  ) {
    fail(
      "START_REMOTE_URL must be an origin without path, query, or fragment.",
    );
  }

  return remoteUrl;
}

function normalizeHostname(hostname: string) {
  return hostname
    .trim()
    .toLowerCase()
    .replace(/^\[(.*)\]$/, "$1");
}

function isIpLiteral(hostname: string) {
  return isIP(normalizeHostname(hostname)) !== 0;
}

function isLocalOrPrivateHost(hostname: string) {
  const normalizedHost = normalizeHostname(hostname);

  if (
    normalizedHost === "localhost" ||
    normalizedHost.endsWith(".localhost") ||
    normalizedHost.endsWith(".local")
  ) {
    return true;
  }

  const ipv4Parts = normalizedHost.split(".").map((part) => Number(part));

  if (
    ipv4Parts.length === 4 &&
    ipv4Parts.every(
      (part) => Number.isInteger(part) && part >= 0 && part <= 255,
    )
  ) {
    const [first = 0, second = 0] = ipv4Parts;

    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && (second === 0 || second === 168)) ||
      (first === 198 && (second === 18 || second === 19)) ||
      first >= 224
    );
  }

  return (
    normalizedHost === "::1" ||
    normalizedHost === "0:0:0:0:0:0:0:1" ||
    normalizedHost.startsWith("fc") ||
    normalizedHost.startsWith("fd") ||
    normalizedHost.startsWith("fe80:")
  );
}

function cloudflareApiError<TResult>(
  envelope: CloudflareApiEnvelope<TResult>,
  fallback: string,
) {
  const messages = envelope.errors
    ?.map((error) => error.message)
    .filter((message): message is string => hasValue(message));

  return messages !== undefined && messages.length > 0
    ? messages.join("; ")
    : fallback;
}

async function readCloudflareResult<TResult>(
  fetchImpl: typeof fetch,
  path: string,
  apiToken: string,
) {
  const response = await fetchImpl(
    `https://api.cloudflare.com/client/v4${path}`,
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    },
  );
  const envelope: CloudflareApiEnvelope<TResult> = await response.json();

  if (!response.ok || envelope.success === false) {
    fail(
      cloudflareApiError(
        envelope,
        `Cloudflare API request failed for ${path}: ${response.status} ${response.statusText}`,
      ),
    );
  }

  if (envelope.result === undefined) {
    fail(`Cloudflare API response for ${path} did not include a result.`);
  }

  return envelope.result;
}

export async function resolveRemoteWorkerBaseUrl({
  env = process.env,
  fetchImpl = fetch,
  rawRemoteUrl = process.env.START_REMOTE_URL,
  workerName = defaultWorkerName,
}: ResolveRemoteWorkerUrlOptions = {}) {
  if (hasValue(rawRemoteUrl)) {
    return normalizeRemoteUrl(rawRemoteUrl);
  }

  const accountId = env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const apiToken = env.CLOUDFLARE_API_TOKEN?.trim();

  if (!hasValue(accountId) || !hasValue(apiToken)) {
    fail(
      [
        "START_REMOTE_URL must be set to the deployed Worker origin, or CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN must be set so the workers.dev URL can be resolved.",
        "",
        "For local OAuth profile deployments, set START_REMOTE_URL after deploy.",
        remoteSmokeCompletionProof,
      ].join("\n"),
    );
  }

  const [accountSubdomain, workerSubdomain] = await Promise.all([
    readCloudflareResult<AccountSubdomainResult>(
      fetchImpl,
      `/accounts/${accountId}/workers/subdomain`,
      apiToken,
    ),
    readCloudflareResult<WorkerSubdomainResult>(
      fetchImpl,
      `/accounts/${accountId}/workers/scripts/${encodeURIComponent(workerName)}/subdomain`,
      apiToken,
    ),
  ]);

  if (!hasValue(accountSubdomain.subdomain)) {
    fail(
      "Cloudflare account does not have a workers.dev subdomain configured.",
    );
  }

  if (workerSubdomain.enabled !== true) {
    fail(
      [
        `Worker ${workerName} is not enabled on workers.dev. Set START_REMOTE_URL to the deployed custom origin before running remote smoke.`,
        remoteSmokeCompletionProof,
      ].join("\n"),
    );
  }

  return normalizeRemoteUrl(
    `https://${workerName}.${accountSubdomain.subdomain}.workers.dev`,
  );
}
