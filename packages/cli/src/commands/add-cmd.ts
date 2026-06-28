import type { Command } from "commander";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { pageDocumentSchema, getSection, type PageDocument } from "@pagelathe/sections";
import { listAvailableSections, sectionComponentPath } from "../registry/read.js";
import { readDocumentYaml, writeDocumentYaml } from "../gen/yaml-doc.js";
import { nextSectionId, addSection } from "../gen/section-ops.js";
import { copyInto } from "../fs/scaffold.js";

type Section = PageDocument["sections"][number];

export interface AddOptions {
  cwd?: string;
  force?: boolean;
  before?: string;
  after?: string;
}

export interface AddResult {
  vendored: boolean;
  componentPath: string;
  id: string;
  position: number;
  total: number;
  yamlPath: string;
}

export async function runAdd(type: string, opts: AddOptions = {}): Promise<AddResult> {
  const reg = getSection(type);
  if (!reg) {
    const available = listAvailableSections()
      .map((s) => s.type)
      .join(", ");
    throw new Error(`Unknown section: "${type}". Available sections: ${available}`);
  }
  const cwd = resolve(opts.cwd ?? process.cwd());
  const yamlPath = join(cwd, "src", "content", "landing", "index.yaml");
  const doc = readDocumentYaml(yamlPath); // throws "run generate first" if no project

  const componentPath = join(cwd, "src", "components", "sections", `${type}.astro`);
  let vendored = false;
  if (!existsSync(componentPath) || opts.force) {
    copyInto(sectionComponentPath(type), componentPath);
    vendored = true;
  }

  const id = nextSectionId(doc, type);
  const entry = { type, id, props: reg.manifest.defaultProps } as Section;
  const { doc: next, position, total } = addSection(doc, entry, {
    before: opts.before,
    after: opts.after,
  });
  // Keystone: validate the whole document BEFORE writing (preserves last-good).
  pageDocumentSchema.parse(next);
  writeDocumentYaml(next, yamlPath);

  return { vendored, componentPath, id, position, total, yamlPath };
}

export function registerAddCommand(program: Command): void {
  program
    .command("add <section>")
    .description("add a section: vendor its component (if needed) and append it to the page")
    .option("--before <id>", "insert before this section id")
    .option("--after <id>", "insert after this section id")
    .option("-f, --force", "re-copy the component file if it already exists")
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .action(
      async (
        section: string,
        options: { before?: string; after?: string; force?: boolean; cwd?: string },
      ) => {
        const res = await runAdd(section, options);
        console.log(
          `✓ Added ${res.id} → ${res.yamlPath} (position ${res.position} of ${res.total})`,
        );
        console.log(
          `  ${res.vendored ? "vendored" : "component already present"}: ${res.componentPath}`,
        );
        console.log(`  Fill it:  pagelathe edit ${res.id} -i "…"`);
      },
    );
}
