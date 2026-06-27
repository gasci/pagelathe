import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Command } from "commander";
import { getApiKey, envVarFor, providerLabel } from "../config/keys.js";
import { loadConfig } from "../config/store.js";
import { assertProvider, type Provider } from "../config/schema.js";
import { getAppDir } from "../registry/read.js";
import { copyAppTemplate, finalizeScaffold } from "../fs/scaffold.js";
import { createLlmClient } from "../gen/factory.js";
import { generate, type GenerateResult } from "../gen/generate.js";
import type { LlmClient } from "../gen/llm.js";
import {
  TokenMeter,
  makeBudgetGuard,
  BudgetAbortError,
  defaultBudgetConfirm,
  type BudgetConfirm,
  type TokenUsage,
} from "../gen/usage.js";
import { promptText } from "../ui/prompts.js";

/** Default token budget before `generate` pauses to confirm (safety net). */
export const DEFAULT_MAX_TOKENS = 100_000;

export interface GenerateCmdOptions {
  cwd?: string;
  description?: string;
  provider?: Provider;
  model?: string;
  llm?: LlmClient;
  /** Scaffold a runnable Astro project into `cwd` first if it isn't one yet. */
  ensureScaffold?: boolean;
  /** Token budget; once reached, `confirm` is asked. 0 (or less) disables the cap. */
  maxTokens?: number;
  /** Budget-reached prompt; injectable for tests. Defaults to a TTY confirm. */
  confirm?: BudgetConfirm;
  onProgress?: (m: string) => void;
}

export interface GenerateCmdResult extends GenerateResult {
  usage: TokenUsage;
}

/** A directory is a project if it already has a package.json — don't overwrite it. */
function isScaffoldedProject(cwd: string): boolean {
  return existsSync(join(cwd, "package.json"));
}

export async function runGenerate(opts: GenerateCmdOptions): Promise<GenerateCmdResult> {
  const description = opts.description?.trim();
  if (!description) throw new Error("A product description is required.");
  const cwd = opts.cwd ?? process.cwd();
  const log = opts.onProgress ?? (() => {});

  const maxTokens = opts.maxTokens ?? DEFAULT_MAX_TOKENS;
  const meter = new TokenMeter();
  meter.onRecord = (_u, agg) => log(`↳ ${agg.totalTokens.toLocaleString()} tokens used so far`);
  const beforeStep = makeBudgetGuard(meter, maxTokens, opts.confirm ?? defaultBudgetConfirm);

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
    llm = createLlmClient({ provider, apiKey: key, model, onUsage: (u) => meter.record(u) });
  }

  // Make `generate` self-sufficient: if there's no project here yet, scaffold the
  // runnable Astro shell so `pnpm install && pnpm dev` works without a prior `init`.
  if (opts.ensureScaffold && !isScaffoldedProject(cwd)) {
    log("Scaffolding project…");
    copyAppTemplate(getAppDir(), cwd);
    finalizeScaffold(cwd);
  }

  const result = await generate({
    description,
    cwd,
    llm,
    onProgress: opts.onProgress,
    beforeStep,
  });
  return { ...result, usage: meter.usage };
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
    .option(
      "--max-tokens <n>",
      `pause and confirm once this many tokens are used; 0 disables (default ${DEFAULT_MAX_TOKENS})`,
    )
    .action(
      async (options: {
        description?: string;
        provider?: string;
        model?: string;
        maxTokens?: string;
      }) => {
        const provider = options.provider ? assertProvider(options.provider) : undefined;
        const maxTokens = options.maxTokens !== undefined ? Number(options.maxTokens) : undefined;
        if (maxTokens !== undefined && Number.isNaN(maxTokens)) {
          throw new Error("--max-tokens must be a number.");
        }
        const description =
          options.description ??
          (await promptText("Describe your product (what it does, who it's for):"));
        try {
          const res = await runGenerate({
            description,
            provider,
            model: options.model,
            maxTokens,
            ensureScaffold: true,
            onProgress: (m) => console.log(`  ${m}`),
          });
          console.log(`\n✓ Generated ${res.vendored.length} sections → ${res.yamlPath}`);
          if (res.usage.totalTokens > 0) {
            console.log(
              `  ${res.usage.totalTokens.toLocaleString()} tokens used (prompt ${res.usage.promptTokens.toLocaleString()} / completion ${res.usage.completionTokens.toLocaleString()})`,
            );
          }
          console.log(`  Next: pnpm install && pnpm dev`);
        } catch (err) {
          if (err instanceof BudgetAbortError) {
            console.log(`\n⚠ ${err.message}`);
            return;
          }
          throw err;
        }
      },
    );
}
