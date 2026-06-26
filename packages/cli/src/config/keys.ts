import { loadConfig, saveConfig } from "./store.js";
import type { Provider } from "./schema.js";

/** Per-provider API-key format checks (loose: prefix + plausible length). */
const KEY_FORMATS: Record<Provider, RegExp> = {
  openrouter: /^sk-or-[A-Za-z0-9-_]{8,}$/,
  openai: /^sk-[A-Za-z0-9-_]{16,}$/,
  gemini: /^AIza[A-Za-z0-9_-]{10,}$/,
};

/** Env vars consulted (in order) before the stored key, per provider.
 *  Typed as a non-empty tuple so `[0]` (the primary var) is always defined. */
const ENV_VARS: Record<Provider, readonly [string, ...string[]]> = {
  openrouter: ["OPENROUTER_API_KEY"],
  openai: ["OPENAI_API_KEY"],
  gemini: ["GEMINI_API_KEY", "GOOGLE_API_KEY"],
};

const LABELS: Record<Provider, string> = {
  openrouter: "OpenRouter",
  openai: "OpenAI",
  gemini: "Gemini",
};

const HINTS: Record<Provider, string> = {
  openrouter: "OpenRouter keys start with 'sk-or-'",
  openai: "OpenAI keys start with 'sk-'",
  gemini: "Gemini (Google AI Studio) keys start with 'AIza'",
};

export type KeySource = "env" | "config" | "none";

export class KeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KeyError";
  }
}

export function providerLabel(provider: Provider): string {
  return LABELS[provider];
}

/** Primary (documented) env var for a provider, e.g. for error messages. */
export function envVarFor(provider: Provider): string {
  return ENV_VARS[provider][0];
}

export function isValidKeyFormat(provider: Provider, key: string): boolean {
  return KEY_FORMATS[provider].test(key);
}

/** Back-compat helper kept for existing callers/tests. */
export function isValidOpenRouterKeyFormat(key: string): boolean {
  return isValidKeyFormat("openrouter", key);
}

function envKey(provider: Provider): string | undefined {
  for (const name of ENV_VARS[provider]) {
    const value = process.env[name];
    if (value && value.trim() !== "") return value;
  }
  return undefined;
}

export function getApiKey(provider: Provider = "openrouter"): string | undefined {
  return envKey(provider) ?? loadConfig().provider.keys[provider];
}

export function getKeySource(provider: Provider = "openrouter"): KeySource {
  if (envKey(provider)) return "env";
  return loadConfig().provider.keys[provider] ? "config" : "none";
}

export function setApiKey(key: string, provider: Provider = "openrouter"): void {
  if (!isValidKeyFormat(provider, key)) {
    throw new KeyError(`That does not look like a ${LABELS[provider]} key (${HINTS[provider]}).`);
  }
  const config = loadConfig();
  config.provider.keys[provider] = key;
  saveConfig(config);
}

/** Show enough of a key to recognize it without revealing it. */
export function maskKey(key: string): string {
  if (key.length <= 10) return `${key.slice(0, 2)}…${key.slice(-2)}`;
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}
