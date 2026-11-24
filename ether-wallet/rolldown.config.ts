import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.ts",
  platform: "node",
  // only the @cartesi/rollup native addon stays out of the bundle: viem and
  // any other pure JavaScript dependency are bundled into dist/index.mjs
  external: ["@cartesi/rollup"],
  output: {
    file: "dist/index.mjs",
    format: "esm",
  },
});
