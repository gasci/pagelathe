import { loadConfig, saveConfig } from "./store.js";

const OPENROUTER_KEY_RE = /^sk-or-[A-Za-z0-9-_]{8,}$/;

export class KeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyError";
  }
}

export function isValidOpenRouterKeyFormat(key: string): boolean {
  return OPENROUTER_KEY_RE.test(key);
}

export function getApiKey(): string | undefined {
  const fromEnv = process.env.OPENROUTER_API_KEY;
  if (fromEnv && fromEnv.trim() !== "") return fromEnv;
  return loadConfig().provider.openrouterKey;
}

export function setApiKey(key: string): void {
  if (!isValidOpenRouterKeyFormat(key)) {
    throw new KeyError(
      "That does not look like an OpenRouter key (expected it to start with 'sk-or-').",
    );
  }
  const config = loadConfig();
  config.provider.openrouterKey = key;
  saveConfig(config);
}

export function maskKey(key: string): string {
  const tail = key.slice(-4);
  return `sk-or-…${tail}`;
}
