import type { Command } from "commander";
import { getApiKey, getKeySource, setApiKey, maskKey, providerLabel } from "../config/keys.js";
import type { KeySource } from "../config/keys.js";
import { loadConfig, saveConfig } from "../config/store.js";
import { PROVIDERS, assertProvider, type Provider } from "../config/schema.js";
import { promptSecret } from "../ui/prompts.js";

export function runSetKey(
  key: string,
  provider?: Provider,
): { ok: true; masked: string; provider: Provider } {
  const target = provider ?? loadConfig().provider.active;
  setApiKey(key, target);
  return { ok: true, masked: maskKey(key), provider: target };
}

export function runUse(provider: Provider): { active: Provider } {
  const config = loadConfig();
  config.provider.active = provider;
  saveConfig(config);
  return { active: provider };
}

export function runSetModel(
  model: string,
  provider?: Provider,
): { provider: Provider; model: string } {
  const config = loadConfig();
  const target = provider ?? config.provider.active;
  config.provider.defaultModel[target] = model;
  saveConfig(config);
  return { provider: target, model };
}

export interface ProviderStatus {
  keySet: boolean;
  maskedKey: string | null;
  source: KeySource;
  defaultModel: string;
}

export interface ShowResult {
  active: Provider;
  providers: Record<Provider, ProviderStatus>;
}

export function runShow(): ShowResult {
  const config = loadConfig();
  const providers = {} as Record<Provider, ProviderStatus>;
  for (const provider of PROVIDERS) {
    const key = getApiKey(provider);
    providers[provider] = {
      keySet: Boolean(key),
      maskedKey: key ? maskKey(key) : null,
      source: getKeySource(provider),
      defaultModel: config.provider.defaultModel[provider],
    };
  }
  return { active: config.provider.active, providers };
}

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("manage pagelathe config, providers, and keys");

  config
    .command("set-key [key]")
    .description("store an API key for a provider locally")
    .option("-p, --provider <provider>", "provider to set the key for (defaults to active)")
    .action(async (key: string | undefined, options: { provider?: string }) => {
      const provider = options.provider
        ? assertProvider(options.provider)
        : loadConfig().provider.active;
      const value = key ?? (await promptSecret(`Paste your ${providerLabel(provider)} API key`));
      const { masked } = runSetKey(value, provider);
      console.log(`✓ Saved ${providerLabel(provider)} key (${masked}).`);
    });

  config
    .command("use <provider>")
    .description("set the active provider (openrouter, gemini, openai)")
    .action((provider: string) => {
      const target = assertProvider(provider);
      runUse(target);
      console.log(`✓ Active provider is now ${providerLabel(target)}.`);
    });

  config
    .command("set-model <model>")
    .description("set the default model id for a provider")
    .option("-p, --provider <provider>", "provider (defaults to active)")
    .action((model: string, options: { provider?: string }) => {
      const provider = options.provider
        ? assertProvider(options.provider)
        : loadConfig().provider.active;
      runSetModel(model, provider);
      console.log(`✓ Default ${providerLabel(provider)} model is now ${model}.`);
    });

  config
    .command("show")
    .description("show providers, keys (masked), and default models")
    .action(() => {
      const out = runShow();
      console.log(`Active provider: ${providerLabel(out.active)}\n`);
      for (const provider of PROVIDERS) {
        const s = out.providers[provider];
        const marker = provider === out.active ? "→" : " ";
        const keyCell = s.keySet ? `${s.maskedKey} (${s.source})` : "— (not set)";
        console.log(
          `${marker} ${providerLabel(provider).padEnd(10)} ${keyCell.padEnd(28)} ${s.defaultModel}`,
        );
      }
    });
}
