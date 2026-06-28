import { join, resolve } from "node:path";
import type { Command } from "commander";
import type { PageDocument } from "@pagelathe/sections";
import { readDocumentYaml } from "../gen/yaml-doc.js";
import { findSection, type Section } from "../gen/section-ops.js";
import { renderPage, renderSection } from "../gen/render-doc.js";

export interface ShowOptions {
  cwd?: string;
  sectionId?: string;
}

export interface ShowResult {
  doc: PageDocument;
  section?: Section;
}

export function runShow(opts: ShowOptions = {}): ShowResult {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const doc = readDocumentYaml(join(cwd, "src", "content", "landing", "index.yaml"));
  if (opts.sectionId === undefined) return { doc };
  const section = findSection(doc, opts.sectionId);
  if (!section) {
    const ids = doc.sections.map((s) => s.id).join(", ") || "(none)";
    throw new Error(`No section with id "${opts.sectionId}". Available ids: ${ids}`);
  }
  return { doc, section };
}

export function registerShowCommand(program: Command): void {
  program
    .command("show [sectionId]")
    .description("pretty-print the generated content (whole page or one section)")
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .option("--json", "output JSON")
    .action((sectionId: string | undefined, options: { cwd?: string; json?: boolean }) => {
      const { doc, section } = runShow({ cwd: options.cwd, sectionId });
      if (options.json) console.log(JSON.stringify(section ?? doc, null, 2));
      else console.log(section ? renderSection(section) : renderPage(doc));
    });
}
