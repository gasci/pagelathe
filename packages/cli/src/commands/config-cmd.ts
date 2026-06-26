import type { Command } from "commander";
import { getApiKey, setApiKey, maskKey } from "../config/keys.js";
import { loadConfig } from "../config/store.js";
import { promptSecret } from "../ui/prompts.js";

export function runSetKey(key: string): { ok: true; masked: string } {
  setApiKey(key);
  return { ok: true, masked: maskKey(key) };
}

export function runShow(): {
  keySet: boolean;
  maskedKey: string | null;
  defaultModel: string;
  source: "env" | "config" | "none";
} {
  const envKey = process.env.OPENROUTER_API_KEY;
  const config = loadConfig();
  const key = getApiKey();
  const source = envKey && envKey.trim() !== "" ? "env" : key ? "config" : "none";
  return {
    keySet: Boolean(key),
    maskedKey: key ? maskKey(key) : null,
    defaultModel: config.provider.defaultModel,
    source,
  };
}

export function registerConfigCommand(program: Command): void {
  const config = program.command("config").description("manage pagelathe config and keys");

  config
    .command("set-key [key]")
    .description("store your OpenRouter API key locally")
    .action(async (key?: string) => {
      const value = key ?? (await promptSecret("Paste your OpenRouter API key"));
      const { masked } = runSetKey(value);
      console.log(`✓ Saved OpenRouter key (${masked}).`);
    });

  config
    .command("show")
    .description("show current config (key is masked)")
    .action(() => {
      const out = runShow();
      console.log(`Key set:       ${out.keySet ? "yes" : "no"}`);
      console.log(`Source:        ${out.source}`);
      console.log(`Key:           ${out.maskedKey ?? "—"}`);
      console.log(`Default model: ${out.defaultModel}`);
    });
}
