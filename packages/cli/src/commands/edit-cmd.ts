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
import { TokenMeter, type TokenUsage } from "../gen/usage.js";
import { promptText } from "../ui/prompts.js";

export interface EditOptions {
  cwd?: string;
  sectionId: string;
  /** Natural-language edit instruction. */
  instruction: string;
  provider?: Provider;
  model?: string;
  /** Injectable for tests; otherwise built from provider config. */
  llm?: LlmClient;
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

  const meter = new TokenMeter();
  meter.onRecord = (_u, agg) => log(`↳ ${agg.totalTokens.toLocaleString()} tokens used so far`);

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

/** Render one leaf change; mark added/removed leaves instead of "→ undefined". */
function describeChange(c: LeafChange): string {
  if (c.from === undefined) return `${c.path}: (added) ${JSON.stringify(c.to)}`;
  if (c.to === undefined) return `${c.path}: ${JSON.stringify(c.from)} (removed)`;
  return `${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`;
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
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .action(
      async (
        sectionId: string,
        options: { instruction?: string; provider?: string; model?: string; cwd?: string },
      ) => {
        const provider = options.provider ? assertProvider(options.provider) : undefined;
        const instruction =
          options.instruction ?? (await promptText(`What should I change in "${sectionId}"?`));
        const res = await runEdit({
          cwd: options.cwd,
          sectionId,
          instruction,
          provider,
          model: options.model,
          onProgress: (m) => console.log(`  ${m}`),
        });
        console.log(`\n✓ Revised ${res.sectionId} → ${res.yamlPath}`);
        if (res.changes.length === 0) console.log("  (no fields changed)");
        for (const c of res.changes) {
          console.log(`  ${describeChange(c)}`);
        }
        if (res.usage.totalTokens > 0) {
          console.log(
            `  ${res.usage.totalTokens.toLocaleString()} tokens used (prompt ${res.usage.promptTokens.toLocaleString()} / completion ${res.usage.completionTokens.toLocaleString()})`,
          );
        }
      },
    );
}
