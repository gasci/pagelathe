import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { listSections } from "../src/registry.js";

const sectionsDir = fileURLToPath(new URL("..", import.meta.url));

describe("registry validation gate", () => {
  it("every section has a real component file and valid defaults", () => {
    const errors: string[] = [];
    for (const s of listSections()) {
      const dir = join(sectionsDir, s.manifest.type);
      const file = join(dir, "section.astro");
      // type must map to a real <type>/ directory carrying both files (ties manifest.type to its dir name)
      if (!existsSync(file)) errors.push(`${s.manifest.type}: missing section.astro`);
      if (!existsSync(join(dir, "schema.ts"))) errors.push(`${s.manifest.type}: missing schema.ts`);
      if (s.manifest.componentFile !== "section.astro")
        errors.push(`${s.manifest.type}: bad componentFile`);
      if (!s.propsSchema.safeParse(s.manifest.defaultProps).success)
        errors.push(`${s.manifest.type}: bad defaults`);
      // entrySchema must accept a well-formed entry built from the section's own defaults
      const entry = { type: s.manifest.type, id: "x", props: s.manifest.defaultProps };
      if (!s.entrySchema.safeParse(entry).success)
        errors.push(`${s.manifest.type}: entrySchema rejects defaults`);
    }
    expect(errors).toEqual([]);
  });
});
