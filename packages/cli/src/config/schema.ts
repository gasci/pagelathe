import { z } from "zod";

/** Supported model providers. `openrouter` is the historical default. */
export const PROVIDERS = ["openrouter", "gemini", "openai"] as const;
export type Provider = (typeof PROVIDERS)[number];

export function isProvider(value: string): value is Provider {
  return (PROVIDERS as readonly string[]).includes(value);
}

/** Parse user input into a Provider, with a friendly error on a bad value. */
export function assertProvider(value: string): Provider {
  if (isProvider(value)) return value;
  throw new Error(`Unknown provider "${value}". Choose one of: ${PROVIDERS.join(", ")}.`);
}

/** Pinned latest-flagship default model per provider. */
export const DEFAULT_MODELS: Record<Provider, string> = {
  openrouter: "anthropic/claude-3.7-sonnet",
  gemini: "gemini-3.5-flash",
  openai: "gpt-5.5",
};

const providerSchema = z.object({
  /** Which provider `generate` uses unless overridden by `--provider`. */
  active: z.enum(PROVIDERS).default("openrouter"),
  /** API keys per provider (may instead come from env at read time). */
  keys: z
    .object({
      openrouter: z.string().min(1).optional(),
      gemini: z.string().min(1).optional(),
      openai: z.string().min(1).optional(),
    })
    .default({}),
  /** Default model id per provider, shown first in any picker. */
  defaultModel: z
    .object({
      openrouter: z.string().min(1).default(DEFAULT_MODELS.openrouter),
      gemini: z.string().min(1).default(DEFAULT_MODELS.gemini),
      openai: z.string().min(1).default(DEFAULT_MODELS.openai),
    })
    .default({ ...DEFAULT_MODELS }),
});

export const pagelatheConfigSchema = z.object({
  version: z.literal(2).default(2),
  provider: providerSchema.default({
    active: "openrouter",
    keys: {},
    defaultModel: { ...DEFAULT_MODELS },
  }),
});

export type PagelatheConfig = z.infer<typeof pagelatheConfigSchema>;
export type ProviderConfig = PagelatheConfig["provider"];

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
