import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  target: "es2022",
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    "effect",
    /^effect\//,
    "drizzle-orm",
    /^drizzle-orm\//,
    "cloudflare:workers",
    /^@math-games\//,
  ],
});
