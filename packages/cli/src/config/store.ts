import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getConfigDir, getConfigFile } from "./paths.js";
import {
  ConfigError,
  DEFAULT_MODELS,
  pagelatheConfigSchema,
  type PagelatheConfig,
} from "./schema.js";

/**
 * Upgrade a legacy v1 config (single `openrouterKey` + string `defaultModel`)
 * to the v2 multi-provider shape. Unknown/newer shapes pass through untouched
 * so schema validation can reject them.
 */
export function migrateConfig(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  const obj = input as Record<string, unknown>;
  if (obj.version !== 1) return input;

  const prov = (obj.provider ?? {}) as Record<string, unknown>;
  const openrouterKey = typeof prov.openrouterKey === "string" ? prov.openrouterKey : undefined;
  const openrouterModel =
    typeof prov.defaultModel === "string" ? prov.defaultModel : DEFAULT_MODELS.openrouter;

  return {
    version: 2,
    provider: {
      active: "openrouter",
      keys: openrouterKey ? { openrouter: openrouterKey } : {},
      defaultModel: {
        openrouter: openrouterModel,
        gemini: DEFAULT_MODELS.gemini,
        openai: DEFAULT_MODELS.openai,
      },
    },
  };
}

export function loadConfig(): PagelatheConfig {
  let raw: string;
  try {
    raw = readFileSync(getConfigFile(), "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return pagelatheConfigSchema.parse({});
    }
    throw new ConfigError(`Could not read config: ${(err as Error).message}`);
  }

  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new ConfigError(`Config file is not valid JSON: ${getConfigFile()}`);
  }

  const result = pagelatheConfigSchema.safeParse(migrateConfig(json));
  if (!result.success) {
    throw new ConfigError(`Config file failed validation: ${result.error.message}`);
  }
  return result.data;
}

export function saveConfig(config: PagelatheConfig): void {
  let validated: PagelatheConfig;
  try {
    validated = pagelatheConfigSchema.parse(config);
  } catch (err) {
    throw new ConfigError(`Invalid config: ${(err as Error).message}`);
  }
  mkdirSync(getConfigDir(), { recursive: true, mode: 0o700 });
  writeFileSync(getConfigFile(), `${JSON.stringify(validated, null, 2)}\n`, { mode: 0o600 });
}
