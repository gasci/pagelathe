import { join, resolve } from "node:path";
import type { Command } from "commander";
import { pageDocumentSchema } from "@pagelathe/sections";
import { getApiKey, envVarFor, providerLabel } from "../config/keys.js";
import { loadConfig } from "../config/store.js";
import { assertProvider, type Provider } from "../config/schema.js";
import { readDocumentYaml, writeDocumentYaml } from "../gen/yaml-doc.js";
import { createLlmClient } from "../gen/factory.js";
import type { LlmClient } from "../gen/llm.js";
import { editSection } from "../gen/edit-section.js";
import { diffLeaves, type LeafChange } from "../gen/set-path.js";
import {
  TokenMeter,
  makeBudgetGuard,
  BudgetAbortError,
  defaultBudgetConfirm,
  type BudgetConfirm,
  type TokenUsage,
} from "../gen/usage.js";
import { promptText } from "../ui/prompts.js";
import { DEFAULT_MAX_TOKENS } from "./generate-cmd.js";

export interface EditOptions {
  cwd?: string;
  sectionId: string;
  /** Natural-language edit instruction. */
  instruction: string;
  provider?: Provider;
  model?: string;
  /** Injectable for tests; otherwise built from provider config. */
  llm?: LlmClient;
  maxTokens?: number;
  confirm?: BudgetConfirm;
  onProgress?: (m: string) => void;
}

export interface EditResult {
  yamlPath: string;
  sectionId: string;
  props: unknown;
  changes: LeafChange[];
  usage: TokenUsage;
}

export async function runEdit(opts: EditOptions): Promise<EditResult> {
  const instruction = opts.instruction?.trim();
  if (!instruction) throw new Error("An edit instruction is required.");
  const cwd = resolve(opts.cwd ?? process.cwd());
  const log = opts.onProgress ?? (() => {});
  const yamlPath = join(cwd, "src", "content", "landing", "index.yaml");
  const doc = readDocumentYaml(yamlPath);

  const section = doc.sections.find((s) => s.id === opts.sectionId);
  if (!section) {
    const ids = doc.sections.map((s) => s.id).join(", ") || "(none)";
    throw new Error(`No section with id "${opts.sectionId}". Available ids: ${ids}`);
  }

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

  const before = section.props;
  await beforeStep();
  log(`Revising ${section.id}…`);
  const newProps = await editSection(
    {
      type: section.type,
      currentProps: before,
      instruction,
      archetype: doc.archetype,
      product: doc.meta.title,
    },
    llm,
  );

  const changes = diffLeaves(before, newProps);
  section.props = newProps;
  // Keystone: validate the whole document BEFORE writing (preserves last-good).
  pageDocumentSchema.parse(doc);
  writeDocumentYaml(doc, yamlPath);

  return { yamlPath, sectionId: section.id, props: newProps, changes, usage: meter.usage };
}

export function registerEditCommand(program: Command): void {
  program
    .command("edit <sectionId>")
    .description("revise one section from a prompt (LLM, schema-bounded)")
    .option("-i, --instruction <text>", "what to change (skips the prompt)")
    .option(
      "-p, --provider <provider>",
      "provider to use (defaults to active: openrouter/gemini/openai)",
    )
    .option("-m, --model <id>", "model id (defaults to the active provider's config)")
    .option(
      "--max-tokens <n>",
      `pause and confirm once this many tokens are used; 0 disables (default ${DEFAULT_MAX_TOKENS})`,
    )
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .action(
      async (
        sectionId: string,
        options: {
          instruction?: string;
          provider?: string;
          model?: string;
          maxTokens?: string;
          cwd?: string;
        },
      ) => {
        const provider = options.provider ? assertProvider(options.provider) : undefined;
        const maxTokens = options.maxTokens !== undefined ? Number(options.maxTokens) : undefined;
        if (maxTokens !== undefined && Number.isNaN(maxTokens)) {
          throw new Error("--max-tokens must be a number.");
        }
        const instruction =
          options.instruction ?? (await promptText(`What should I change in "${sectionId}"?`));
        try {
          const res = await runEdit({
            cwd: options.cwd,
            sectionId,
            instruction,
            provider,
            model: options.model,
            maxTokens,
            onProgress: (m) => console.log(`  ${m}`),
          });
          console.log(`\n✓ Revised ${res.sectionId} → ${res.yamlPath}`);
          if (res.changes.length === 0) console.log("  (no fields changed)");
          for (const c of res.changes) {
            console.log(`  ${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`);
          }
          if (res.usage.totalTokens > 0) {
            console.log(
              `  ${res.usage.totalTokens.toLocaleString()} tokens used (prompt ${res.usage.promptTokens.toLocaleString()} / completion ${res.usage.completionTokens.toLocaleString()})`,
            );
          }
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
