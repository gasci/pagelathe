import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/** Reads the version from the package.json shipped alongside the build. */
export function getVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // dist/bin.js and dist/index.js sit one level below package.json.
  const pkgPath = join(here, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  return pkg.version;
}
