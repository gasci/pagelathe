import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runSetKey, runShow } from "../src/commands/config-cmd.js";
import { KeyError } from "../src/config/keys.js";

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "plt-cfgcmd-"));
  process.env.PAGELATHE_CONFIG_DIR = dir;
  delete process.env.OPENROUTER_API_KEY;
});

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
  delete process.env.OPENROUTER_API_KEY;
  rmSync(dir, { recursive: true, force: true });
});

describe("config command core", () => {
  it("set-key validates and returns a masked key", () => {
    const res = runSetKey("sk-or-v1-abcdef1234WXYZ");
    expect(res.ok).toBe(true);
    expect(res.masked).toBe("sk-or-…WXYZ");
  });

  it("set-key throws on bad input", () => {
    expect(() => runSetKey("bad")).toThrow(KeyError);
  });

  it("show reports no key initially", () => {
    expect(runShow()).toEqual({
      keySet: false,
      maskedKey: null,
      defaultModel: "anthropic/claude-3.7-sonnet",
      source: "none",
    });
  });

  it("show reports the config source after set-key", () => {
    runSetKey("sk-or-v1-abcdef1234WXYZ");
    const out = runShow();
    expect(out.keySet).toBe(true);
    expect(out.source).toBe("config");
    expect(out.maskedKey).toBe("sk-or-…WXYZ");
  });

  it("show reports the env source when env var is set", () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-envkey0000EFGH";
    const out = runShow();
    expect(out.source).toBe("env");
    expect(out.maskedKey).toBe("sk-or-…EFGH");
  });
});
