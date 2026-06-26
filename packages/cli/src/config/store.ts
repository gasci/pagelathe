import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getConfigDir, getConfigFile } from "./paths.js";
import { ConfigError, pagelatheConfigSchema, type PagelatheConfig } from "./schema.js";

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

  const result = pagelatheConfigSchema.safeParse(json);
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
