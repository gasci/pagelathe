import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, statSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, saveConfig, migrateConfig } from "../src/config/store.js";
import { ConfigError, DEFAULT_MODELS } from "../src/config/schema.js";

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
  it("returns v2 defaults when no file exists", () => {
    const cfg = loadConfig();
    expect(cfg.version).toBe(2);
    expect(cfg.provider.active).toBe("openrouter");
    expect(cfg.provider.keys).toEqual({});
    expect(cfg.provider.defaultModel.openrouter).toBe(DEFAULT_MODELS.openrouter);
    expect(cfg.provider.defaultModel.gemini).toBe(DEFAULT_MODELS.gemini);
    expect(cfg.provider.defaultModel.openai).toBe(DEFAULT_MODELS.openai);
  });

  it("round-trips a saved config", () => {
    saveConfig({
      version: 2,
      provider: {
        active: "gemini",
        keys: { openrouter: "sk-or-abc", gemini: "AIza-xyz" },
        defaultModel: {
          openrouter: "google/gemini-2.0-flash",
          gemini: "gemini-3.5-flash",
          openai: "gpt-5.5",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.provider.active).toBe("gemini");
    expect(cfg.provider.keys.openrouter).toBe("sk-or-abc");
    expect(cfg.provider.keys.gemini).toBe("AIza-xyz");
    expect(cfg.provider.defaultModel.openrouter).toBe("google/gemini-2.0-flash");
  });

  it("migrates a legacy v1 config to the v2 shape", () => {
    writeFileSync(
      join(dir, "config.json"),
      JSON.stringify({
        version: 1,
        provider: { openrouterKey: "sk-or-legacy", defaultModel: "google/gemini-2.0-flash" },
      }),
    );
    const cfg = loadConfig();
    expect(cfg.version).toBe(2);
    expect(cfg.provider.active).toBe("openrouter");
    expect(cfg.provider.keys.openrouter).toBe("sk-or-legacy");
    expect(cfg.provider.defaultModel.openrouter).toBe("google/gemini-2.0-flash");
    // untouched providers fall back to pinned defaults
    expect(cfg.provider.defaultModel.gemini).toBe(DEFAULT_MODELS.gemini);
    expect(cfg.provider.defaultModel.openai).toBe(DEFAULT_MODELS.openai);
  });

  it("migrateConfig leaves a v2 config unchanged", () => {
    const v2 = { version: 2, provider: { active: "openai", keys: {}, defaultModel: {} } };
    expect(migrateConfig(v2)).toBe(v2);
  });

  it("writes the config file with 0600 permissions", () => {
    saveConfig(loadConfig());
    const mode = statSync(join(dir, "config.json")).mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it("never persists keys it was not given (no empty-string leakage)", () => {
    saveConfig(loadConfig());
    const onDisk = readFileSync(join(dir, "config.json"), "utf8");
    expect(onDisk).not.toContain("openrouterKey");
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
