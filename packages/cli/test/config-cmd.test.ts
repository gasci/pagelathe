import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSetKey, runShow, runUse, runSetModel } from "../src/commands/config-cmd.js";
import { KeyError } from "../src/config/keys.js";

let dir: string;
const ENV_VARS = ["OPENROUTER_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plt-cfgcmd-"));
  process.env.PAGELATHE_CONFIG_DIR = dir;
  for (const v of ENV_VARS) delete process.env[v];
});

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
  for (const v of ENV_VARS) delete process.env[v];
  rmSync(dir, { recursive: true, force: true });
});

describe("config command core", () => {
  it("set-key validates and returns a masked key (active provider)", () => {
    const res = runSetKey("sk-or-v1-abcdef1234WXYZ");
    expect(res.ok).toBe(true);
    expect(res.masked).toBe("sk-or-…WXYZ");
    expect(res.provider).toBe("openrouter");
  });

  it("set-key targets the named provider", () => {
    const res = runSetKey("AIzaSyA-bcdef0123456789", "gemini");
    expect(res.provider).toBe("gemini");
    expect(runShow().providers.gemini.keySet).toBe(true);
  });

  it("set-key throws on bad input", () => {
    expect(() => runSetKey("bad")).toThrow(KeyError);
  });

  it("show reports no keys and pinned default models initially", () => {
    const out = runShow();
    expect(out.active).toBe("openrouter");
    expect(out.providers.openrouter).toEqual({
      keySet: false,
      maskedKey: null,
      source: "none",
      defaultModel: "anthropic/claude-3.7-sonnet",
    });
    expect(out.providers.gemini.defaultModel).toBe("gemini-3.5-flash");
    expect(out.providers.openai.defaultModel).toBe("gpt-5.5");
  });

  it("show reports the config source after set-key", () => {
    runSetKey("sk-or-v1-abcdef1234WXYZ");
    const out = runShow();
    expect(out.providers.openrouter.keySet).toBe(true);
    expect(out.providers.openrouter.source).toBe("config");
    expect(out.providers.openrouter.maskedKey).toBe("sk-or-…WXYZ");
  });

  it("show reports the env source when env var is set", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-envkey0000EFGH";
    const out = runShow();
    expect(out.providers.openrouter.source).toBe("env");
    expect(out.providers.openrouter.maskedKey).toBe("sk-or-…EFGH");
  });

  it("use switches the active provider", () => {
    runUse("gemini");
    expect(runShow().active).toBe("gemini");
  });

  it("set-model updates a provider's default model", () => {
    runSetModel("gemini-2.5-pro", "gemini");
    expect(runShow().providers.gemini.defaultModel).toBe("gemini-2.5-pro");
    // defaults to active provider when none given
    runSetModel("anthropic/claude-opus-4");
    expect(runShow().providers.openrouter.defaultModel).toBe("anthropic/claude-opus-4");
  });
});
