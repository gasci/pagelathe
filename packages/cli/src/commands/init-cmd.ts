import type { Command } from "commander";
import { resolve, join } from "node:path";
import { getAppDir, sectionComponentPath, DEFAULT_PAGE_SECTIONS } from "../registry/read.js";
import { copyAppTemplate, copyInto, isNonEmptyDir, finalizeScaffold } from "../fs/scaffold.js";

export interface InitOptions {
  force?: boolean;
}

export async function runInit(
  targetDir: string,
  opts: InitOptions = {},
): Promise<{ created: string[] }> {
  const dest = resolve(targetDir);
  if (isNonEmptyDir(dest) && !opts.force) {
    throw new Error(`Directory ${dest} is not empty. Use --force to scaffold anyway.`);
  }
  const created = copyAppTemplate(getAppDir(), dest);
  for (const type of DEFAULT_PAGE_SECTIONS) {
    copyInto(
      sectionComponentPath(type),
      join(dest, "src", "components", "sections", `${type}.astro`),
    );
  }
  finalizeScaffold(dest);
  return { created };
}

export function registerInitCommand(program: Command): void {
  program
    .command("init [dir]")
    .description("scaffold a new pagelathe landing project")
    .option("-f, --force", "scaffold into a non-empty directory")
    .action(async (dir: string | undefined, options: InitOptions) => {
      const target = dir ?? ".";
      await runInit(target, options);
      console.log(`✓ Scaffolded pagelathe project in ${resolve(target)}.`);
      console.log(`  Next: cd ${target} && pnpm install && pnpm dev`);
    });
}
