import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  isValidOpenRouterKeyFormat,
  getApiKey,
  setApiKey,
  maskKey,
  KeyError,
} from "../src/config/keys.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plt-keys-"));
  process.env.PAGELATHE_CONFIG_DIR = dir;
  delete process.env.OPENROUTER_API_KEY;
});

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
  delete process.env.OPENROUTER_API_KEY;
  rmSync(dir, { recursive: true, force: true });
});

describe("key vault", () => {
  it("validates OpenRouter key format", () => {
    expect(isValidOpenRouterKeyFormat("sk-or-v1-abcdef123456")).toBe(true);
    expect(isValidOpenRouterKeyFormat("sk-12345")).toBe(false);
    expect(isValidOpenRouterKeyFormat("")).toBe(false);
  });

  it("setApiKey persists and getApiKey reads it back", () => {
    setApiKey("sk-or-v1-abcdef123456");
    expect(getApiKey()).toBe("sk-or-v1-abcdef123456");
  });

  it("rejects malformed keys", () => {
    expect(() => setApiKey("nope")).toThrow(KeyError);
  });

  it("env var takes precedence over stored config", () => {
    setApiKey("sk-or-v1-storedkey0000");
    process.env.OPENROUTER_API_KEY = "sk-or-v1-envkey000000";
    expect(getApiKey()).toBe("sk-or-v1-envkey000000");
  });

  it("masks keys for display", () => {
    expect(maskKey("sk-or-v1-abcdef1234WXYZ")).toBe("sk-or-…WXYZ");
  });
});
