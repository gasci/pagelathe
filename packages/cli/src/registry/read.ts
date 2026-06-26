import { existsSync } from "node:fs";
import { join } from "node:path";
import { listSections } from "@pagelathe/sections";
import { getSectionsDir, getAppDir, RegistryError } from "./paths.js";

export { getAppDir, RegistryError };

export interface AvailableSection {
  type: string;
  title: string;
  required: boolean;
}

export function listAvailableSections(): AvailableSection[] {
  return listSections().map((s) => ({
    type: s.manifest.type,
    title: s.manifest.title,
    required: s.manifest.required,
  }));
}

export function sectionComponentPath(type: string): string {
  const known = listSections().some((s) => s.manifest.type === type);
  if (!known) throw new RegistryError(`Unknown section: "${type}".`);
  const path = join(getSectionsDir(), type, "section.astro");
  if (!existsSync(path)) {
    throw new RegistryError(`Section "${type}" has no section.astro at ${path}.`);
  }
  return path;
}

/** The default R-set page, in canonical order, that `init` vendors. */
export const DEFAULT_PAGE_SECTIONS = [
  "header",
  "hero",
  "features",
  "codeDemo",
  "pricing",
  "finalCta",
  "footer",
] as const;
