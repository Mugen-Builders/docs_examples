// rolldown.config.js
import { defineConfig } from "rolldown";

export default defineConfig({
  input: "src/index.js",
  platform: "node",
  // only the @cartesi/rollup native addon stays out of the bundle: expr-eval-fork
  // and any other pure JavaScript dependency are bundled into dist/index.mjs
  external: ["@cartesi/rollup"],
  output: {
    file: "dist/index.mjs",
    format: "esm",
  },
});
