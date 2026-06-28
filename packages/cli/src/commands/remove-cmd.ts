import { join, resolve } from "node:path";
import type { Command } from "commander";
import { pageDocumentSchema } from "@pagelathe/sections";
import { readDocumentYaml, writeDocumentYaml } from "../gen/yaml-doc.js";
import { removeSection } from "../gen/section-ops.js";

export interface RemoveOptions {
  cwd?: string;
  sectionId: string;
}

export interface RemoveResult {
  yamlPath: string;
  removedId: string;
  removedType: string;
  typeStillUsed: boolean;
}

export function runRemove(opts: RemoveOptions): RemoveResult {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const yamlPath = join(cwd, "src", "content", "landing", "index.yaml");
  const doc = readDocumentYaml(yamlPath);
  const { doc: next, removed, typeStillUsed } = removeSection(doc, opts.sectionId);
  // Keystone: validate the whole document BEFORE writing (preserves last-good).
  pageDocumentSchema.parse(next);
  writeDocumentYaml(next, yamlPath);
  return { yamlPath, removedId: removed.id, removedType: removed.type, typeStillUsed };
}

export function registerRemoveCommand(program: Command): void {
  program
    .command("remove <sectionId>")
    .description("remove a section from the page (index.yaml)")
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .action((sectionId: string, options: { cwd?: string }) => {
      const res = runRemove({ cwd: options.cwd, sectionId });
      console.log(`✓ Removed ${res.removedId} → ${res.yamlPath}`);
      if (!res.typeStillUsed) {
        console.log(
          `  Note: no section now uses "${res.removedType}"; src/components/sections/${res.removedType}.astro is unused (left in place).`,
        );
      }
    });
}
