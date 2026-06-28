import { join, resolve } from "node:path";
import type { Command } from "commander";
import type { PageDocument } from "@pagelathe/sections";
import { readDocumentYaml } from "../gen/yaml-doc.js";
import { renderList, listToJson } from "../gen/render-doc.js";

export interface ListOptions {
  cwd?: string;
}

export interface ListResult {
  doc: PageDocument;
}

export function runList(opts: ListOptions = {}): ListResult {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const doc = readDocumentYaml(join(cwd, "src", "content", "landing", "index.yaml"));
  return { doc };
}

export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description("list the project's sections and their content children")
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .option("--json", "output JSON")
    .action((options: { cwd?: string; json?: boolean }) => {
      const { doc } = runList({ cwd: options.cwd });
      console.log(options.json ? JSON.stringify(listToJson(doc), null, 2) : renderList(doc));
    });
}
