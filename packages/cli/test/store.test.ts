import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, saveConfig } from "../src/config/store.js";
import { ConfigError } from "../src/config/schema.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plt-store-"));
  process.env.PAGELATHE_CONFIG_DIR = dir;
});

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
  rmSync(dir, { recursive: true, force: true });
});

describe("config store", () => {
  it("returns defaults when no file exists", () => {
    const cfg = loadConfig();
    expect(cfg.version).toBe(1);
    expect(cfg.provider.defaultModel).toBe("anthropic/claude-3.7-sonnet");
  });

  it("round-trips a saved config", () => {
    saveConfig({
      version: 1,
      provider: { openrouterKey: "sk-or-abc", defaultModel: "google/gemini-2.0-flash" },
    });
    const cfg = loadConfig();
    expect(cfg.provider.openrouterKey).toBe("sk-or-abc");
    expect(cfg.provider.defaultModel).toBe("google/gemini-2.0-flash");
  });

  it("writes the config file with 0600 permissions", () => {
    saveConfig({ version: 1, provider: { defaultModel: "anthropic/claude-3.7-sonnet" } });
    const mode = statSync(join(dir, "config.json")).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("throws ConfigError on malformed JSON", () => {
    writeFileSync(join(dir, "config.json"), "{ not json");
    expect(() => loadConfig()).toThrow(ConfigError);
  });

  it("throws ConfigError on schema-invalid config", () => {
    writeFileSync(join(dir, "config.json"), JSON.stringify({ version: 99 }));
    expect(() => loadConfig()).toThrow(ConfigError);
  });
});
