import { defineConfig } from "tsup";

// Builds the `./forge` entry consumed by the infra level-forge worker. Alchemy
// imports that worker via plain Node ESM at deploy time, which can't resolve
// this package's bundler-style source imports (extensionless + `./logic`
// barrels), so we ship a single self-contained file: workspace deps are
// bundled in, only `effect` (a proper ESM package) stays external. `three` is
// never reached from solution-forge but is marked external for safety.
export default defineConfig({
  entry: ["src/solution-forge.ts"],
  format: ["esm"],
  target: "es2022",
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ["effect", /^effect\//, "three", /^three\//],
  noExternal: [/^@math-games\//],
});
