import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin.ts", "src/index.ts"],
  format: ["esm"],
  target: "node20",
  clean: true,
  dts: false,
  // @pagelathe/sections is a private, TypeScript-only workspace package; bundle
  // its source into the CLI so the built/published artifact runs without it.
  noExternal: ["@pagelathe/sections"],
  banner: { js: "#!/usr/bin/env node" },
});
