import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistryError";
  }
}

/** Locate the monorepo (or bundled) registry root containing sections + app. */
export function getRegistryRoot(): string {
  const override = process.env.PAGELATHE_REGISTRY_DIR;
  if (override && override.trim() !== "") return resolve(override);

  let dir = dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 8; i++) {
    const candidate = join(dir, "registry");
    if (existsSync(join(candidate, "sections")) && existsSync(join(candidate, "app"))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new RegistryError(
    "Could not locate the pagelathe registry. Set PAGELATHE_REGISTRY_DIR to the registry/ directory.",
  );
}

export function getSectionsDir(): string {
  return join(getRegistryRoot(), "sections");
}

export function getAppDir(): string {
  return join(getRegistryRoot(), "app");
}
