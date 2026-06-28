import { Command } from "commander";
import { getVersion } from "./version.js";
import { registerConfigCommand } from "./commands/config-cmd.js";
import { registerInitCommand } from "./commands/init-cmd.js";
import { registerAddCommand } from "./commands/add-cmd.js";
import { registerEditCommand } from "./commands/edit-cmd.js";
import { registerListCommand } from "./commands/list-cmd.js";
import { registerShowCommand } from "./commands/show-cmd.js";
import { registerGenerateCommand } from "./commands/generate-cmd.js";

export function buildProgram(): Command {
  const program = new Command();
  program
    .name("pagelathe")
    .description("AI landing-page builder for technical founders")
    .version(getVersion(), "-v, --version", "print the pagelathe version");
  registerConfigCommand(program);
  registerInitCommand(program);
  registerAddCommand(program);
  registerEditCommand(program);
  registerListCommand(program);
  registerShowCommand(program);
  registerGenerateCommand(program);
  return program;
}

export async function cli(argv: string[]): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
