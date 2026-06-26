import type { Command } from "commander";
import { getApiKey } from "../config/keys.js";
import { loadConfig } from "../config/store.js";
import { createOpenRouterClient } from "../gen/provider.js";
import { generate, type GenerateResult } from "../gen/generate.js";
import type { LlmClient } from "../gen/llm.js";
import { promptText } from "../ui/prompts.js";

export interface GenerateCmdOptions {
  cwd?: string;
  description?: string;
  model?: string;
  llm?: LlmClient;
  onProgress?: (m: string) => void;
}

export async function runGenerate(opts: GenerateCmdOptions): Promise<GenerateResult> {
  const description = opts.description?.trim();
  if (!description) throw new Error("A product description is required.");
  let llm = opts.llm;
  if (!llm) {
    const key = getApiKey();
    if (!key) {
      throw new Error(
        "No OpenRouter key found. Run `pagelathe config set-key` or set OPENROUTER_API_KEY.",
      );
    }
    const model = opts.model ?? loadConfig().provider.defaultModel;
    llm = createOpenRouterClient({ apiKey: key, model, appName: "pagelathe" });
  }
  return generate({
    description,
    cwd: opts.cwd ?? process.cwd(),
    llm,
    onProgress: opts.onProgress,
  });
}

export function registerGenerateCommand(program: Command): void {
  program
    .command("generate")
    .description("describe your product and generate an on-brand landing page")
    .option("-d, --description <text>", "product description (skips the prompt)")
    .option("-m, --model <id>", "OpenRouter model id (defaults to your config)")
    .action(async (options: { description?: string; model?: string }) => {
      const description =
        options.description ??
        (await promptText("Describe your product (what it does, who it's for):"));
      const res = await runGenerate({
        description,
        model: options.model,
        onProgress: (m) => console.log(`  ${m}`),
      });
      console.log(`\n✓ Generated ${res.vendored.length} sections → ${res.yamlPath}`);
      console.log(`  Next: pnpm dev`);
    });
}
