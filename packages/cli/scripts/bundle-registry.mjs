// Bundle the section + app-engine templates into dist/registry so the PUBLISHED
// package is self-contained: `pagelathe init/add/generate` resolve section
// components and the Astro app from here when there is no monorepo on disk.
// (The section *schemas* are TypeScript and are bundled into the CLI code by
// tsup; this script ships only the on-disk template files.)
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRegistry = join(here, "..", "..", "..", "registry");
const destRegistry = join(here, "..", "dist", "registry");

const SKIP = new Set(["node_modules", "dist", ".astro"]);

/** cpSync filter: skip build artifacts and any build-vendored section copies. */
function filter(src) {
  const base = src.split(/[\\/]/).pop() ?? "";
  if (SKIP.has(base)) return false;
  if (/[\\/]app[\\/]src[\\/]components[\\/]sections[\\/].+\.astro$/.test(src)) return false;
  return true;
}

rmSync(destRegistry, { recursive: true, force: true });
mkdirSync(destRegistry, { recursive: true });
for (const name of ["sections", "app"]) {
  cpSync(join(repoRegistry, name), join(destRegistry, name), { recursive: true, filter });
}
console.log("Bundled registry into dist/registry (sections + app).");
