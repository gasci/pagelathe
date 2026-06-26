import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { listSections } from "../registry/sections/src/registry.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sectionsDir = join(root, "registry", "sections");
const errors = [];

for (const s of listSections()) {
  const { type, componentFile, defaultProps } = s.manifest;
  const file = join(sectionsDir, type, componentFile);
  if (componentFile !== "section.astro")
    errors.push(`${type}: componentFile must be section.astro`);
  if (!existsSync(file)) errors.push(`${type}: missing ${file}`);
  if (!s.propsSchema.safeParse(defaultProps).success)
    errors.push(`${type}: defaultProps fail schema`);
  if (!s.entrySchema.safeParse({ type, id: "x", props: defaultProps }).success) {
    errors.push(`${type}: entrySchema rejects defaultProps`);
  }
}

if (errors.length > 0) {
  console.error("Registry validation failed:\n" + errors.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}
console.log(`Registry OK: ${listSections().length} sections validated.`);
