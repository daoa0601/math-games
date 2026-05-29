import * as Cloudflare from "alchemy/Cloudflare";

// Shared resource handles. Declared here (rather than inline in the stack) so
// both alchemy.run.ts and the class-based level-forge worker can reference the
// same KV namespace — the stack yields it for its bindings, the worker binds it
// via `Cloudflare.KVNamespace.bind(Cache)`.
export const Cache = Cloudflare.KVNamespace("CACHE", {
  title: "math-games-cache",
});
