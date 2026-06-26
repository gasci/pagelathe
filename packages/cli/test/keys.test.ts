import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isValidOpenRouterKeyFormat,
  isValidKeyFormat,
  getApiKey,
  getKeySource,
  setApiKey,
  maskKey,
  envVarFor,
  KeyError,
} from "../src/config/keys.js";

let dir: string;
const ENV_VARS = ["OPENROUTER_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "GOOGLE_API_KEY"];

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plt-keys-"));
  process.env.PAGELATHE_CONFIG_DIR = dir;
  for (const v of ENV_VARS) delete process.env[v];
});

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
  for (const v of ENV_VARS) delete process.env[v];
  rmSync(dir, { recursive: true, force: true });
});

describe("key vault", () => {
  it("validates OpenRouter key format", () => {
    expect(isValidOpenRouterKeyFormat("sk-or-v1-abcdef123456")).toBe(true);
    expect(isValidOpenRouterKeyFormat("sk-12345")).toBe(false);
    expect(isValidOpenRouterKeyFormat("")).toBe(false);
  });

  it("validates per-provider key formats", () => {
    expect(isValidKeyFormat("openai", "sk-proj-abcdef0123456789xyz")).toBe(true);
    expect(isValidKeyFormat("openai", "AIzaSyAbc")).toBe(false);
    expect(isValidKeyFormat("gemini", "AIzaSyA-bcdef0123456789")).toBe(true);
    expect(isValidKeyFormat("gemini", "sk-or-v1-abcdef123456")).toBe(false);
  });

  it("setApiKey persists and getApiKey reads it back (default openrouter)", () => {
    setApiKey("sk-or-v1-abcdef123456");
    expect(getApiKey()).toBe("sk-or-v1-abcdef123456");
  });

  it("stores keys per provider independently", () => {
    setApiKey("sk-or-v1-abcdef123456", "openrouter");
    setApiKey("AIzaSyA-bcdef0123456789", "gemini");
    setApiKey("sk-proj-abcdef0123456789xyz", "openai");
    expect(getApiKey("openrouter")).toBe("sk-or-v1-abcdef123456");
    expect(getApiKey("gemini")).toBe("AIzaSyA-bcdef0123456789");
    expect(getApiKey("openai")).toBe("sk-proj-abcdef0123456789xyz");
  });

  it("rejects malformed keys per provider", () => {
    expect(() => setApiKey("nope")).toThrow(KeyError);
    expect(() => setApiKey("sk-or-v1-abc", "gemini")).toThrow(KeyError);
    expect(() => setApiKey("AIza-short", "openai")).toThrow(KeyError);
  });

  it("env var takes precedence over stored config (openrouter)", () => {
    setApiKey("sk-or-v1-storedkey0000");
    process.env.OPENROUTER_API_KEY = "sk-or-v1-envkey000000";
    expect(getApiKey()).toBe("sk-or-v1-envkey000000");
    expect(getKeySource("openrouter")).toBe("env");
  });

  it("gemini reads GEMINI_API_KEY then GOOGLE_API_KEY", () => {
    process.env.GOOGLE_API_KEY = "AIza-google-fallback-000";
    expect(getApiKey("gemini")).toBe("AIza-google-fallback-000");
    process.env.GEMINI_API_KEY = "AIza-gemini-primary-0000";
    expect(getApiKey("gemini")).toBe("AIza-gemini-primary-0000");
  });

  it("reports key source", () => {
    expect(getKeySource("openai")).toBe("none");
    setApiKey("sk-proj-abcdef0123456789xyz", "openai");
    expect(getKeySource("openai")).toBe("config");
  });

  it("exposes the primary env var per provider", () => {
    expect(envVarFor("openrouter")).toBe("OPENROUTER_API_KEY");
    expect(envVarFor("openai")).toBe("OPENAI_API_KEY");
    expect(envVarFor("gemini")).toBe("GEMINI_API_KEY");
  });

  it("masks keys for display", () => {
    expect(maskKey("sk-or-v1-abcdef1234WXYZ")).toBe("sk-or-…WXYZ");
    expect(maskKey("AIzaSyA-bcdef0123456789")).toBe("AIzaSy…6789");
  });
});
