import { homedir } from "node:os";
import { join } from "node:path";

export function getConfigDir(): string {
  const override = process.env.PAGELATHE_CONFIG_DIR;
  if (override && override.trim() !== "") return override;
  return join(homedir(), ".pagelathe");
}

export function getConfigFile(): string {
  return join(getConfigDir(), "config.json");
}
