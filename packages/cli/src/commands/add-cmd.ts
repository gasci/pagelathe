import type { Command } from "commander";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { listAvailableSections, sectionComponentPath } from "../registry/read.js";
import { copyInto } from "../fs/scaffold.js";

export interface AddOptions {
  cwd?: string;
  force?: boolean;
}

export async function runAdd(type: string, opts: AddOptions = {}): Promise<{ written: string }> {
  const src = sectionComponentPath(type); // throws RegistryError ("Unknown section") if invalid
  const cwd = resolve(opts.cwd ?? process.cwd());
  const dest = join(cwd, "src", "components", "sections", `${type}.astro`);
  if (existsSync(dest) && !opts.force) {
    throw new Error(`${dest} exists. Use --force to overwrite.`);
  }
  copyInto(src, dest);
  return { written: dest };
}

export function registerAddCommand(program: Command): void {
  program
    .command("add <section>")
    .description("vendor a section component from the registry into this project")
    .option("-f, --force", "overwrite an existing section file")
    .action(async (section: string, options: { force?: boolean }) => {
      try {
        const { written } = await runAdd(section, options);
        console.log(`✓ Added ${section} → ${written}`);
      } catch (err) {
        const available = listAvailableSections()
          .map((s) => s.type)
          .join(", ");
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`${msg}\nAvailable sections: ${available}`);
      }
    });
}
