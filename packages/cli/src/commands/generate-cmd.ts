import type { Command } from "commander";
import { getApiKey, envVarFor, providerLabel } from "../config/keys.js";
import { loadConfig } from "../config/store.js";
import { assertProvider, type Provider } from "../config/schema.js";
import { createLlmClient } from "../gen/factory.js";
import { generate, type GenerateResult } from "../gen/generate.js";
import type { LlmClient } from "../gen/llm.js";
import { promptText } from "../ui/prompts.js";

export interface GenerateCmdOptions {
  cwd?: string;
  description?: string;
  provider?: Provider;
  model?: string;
  llm?: LlmClient;
  onProgress?: (m: string) => void;
}

export async function runGenerate(opts: GenerateCmdOptions): Promise<GenerateResult> {
  const description = opts.description?.trim();
  if (!description) throw new Error("A product description is required.");
  let llm = opts.llm;
  if (!llm) {
    const config = loadConfig();
    const provider = opts.provider ?? config.provider.active;
    const key = getApiKey(provider);
    if (!key) {
      throw new Error(
        `No ${providerLabel(provider)} key found. Run \`pagelathe config set-key --provider ${provider}\` or set ${envVarFor(provider)}.`,
      );
    }
    const model = opts.model ?? config.provider.defaultModel[provider];
    llm = createLlmClient({ provider, apiKey: key, model });
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
    .option(
      "-p, --provider <provider>",
      "provider to use (defaults to active: openrouter/gemini/openai)",
    )
    .option("-m, --model <id>", "model id (defaults to the active provider's config)")
    .action(async (options: { description?: string; provider?: string; model?: string }) => {
      const provider = options.provider ? assertProvider(options.provider) : undefined;
      const description =
        options.description ??
        (await promptText("Describe your product (what it does, who it's for):"));
      const res = await runGenerate({
        description,
        provider,
        model: options.model,
        onProgress: (m) => console.log(`  ${m}`),
      });
      console.log(`\n✓ Generated ${res.vendored.length} sections → ${res.yamlPath}`);
      console.log(`  Next: pnpm dev`);
    });
}
