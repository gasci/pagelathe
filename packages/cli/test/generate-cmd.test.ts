import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ZodType } from "zod";
import { runGenerate } from "../src/commands/generate-cmd.js";
import { getSection } from "@pagelathe/sections";
import type { LlmClient } from "../src/gen/llm.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-gencmd-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function fake(): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>, opts: { schemaName?: string }) => {
      const n = opts.schemaName ?? "";
      if (n === "archetype")
        return Promise.resolve(schema.parse({ archetype: "general", reason: "r" }));
      if (n === "page_meta")
        return Promise.resolve(
          schema.parse({ title: "B — x", description: "d", primaryGoal: "signup", brand: "B" }),
        );
      if (n === "section_plan") return Promise.resolve(schema.parse({ sections: ["hero"] }));
      return Promise.resolve(
        schema.parse(getSection(n.replace(/_props$/, ""))!.manifest.defaultProps),
      );
    },
  };
}

describe("runGenerate", () => {
  it("generates into cwd with an injected llm", async () => {
    const cwd = tmp();
    const res = await runGenerate({ cwd, description: "a CLI tool", llm: fake() });
    expect(existsSync(res.yamlPath)).toBe(true);
  });

  it("returns token usage and accepts a token budget", async () => {
    const cwd = tmp();
    const res = await runGenerate({ cwd, description: "a CLI tool", llm: fake(), maxTokens: 5 });
    expect(existsSync(res.yamlPath)).toBe(true);
    // an injected llm reports no usage, so the budget never trips
    expect(res.usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
  });

  it("auto-scaffolds a runnable project when cwd has no package.json (ensureScaffold)", async () => {
    const cwd = tmp();
    const res = await runGenerate({
      cwd,
      description: "a CLI tool",
      llm: fake(),
      ensureScaffold: true,
    });
    // generated content
    expect(existsSync(res.yamlPath)).toBe(true);
    // scaffolded shell so `pnpm install && pnpm dev` works
    expect(existsSync(join(cwd, "package.json"))).toBe(true);
    expect(existsSync(join(cwd, "astro.config.mjs"))).toBe(true);
  });

  it("does not scaffold when ensureScaffold is unset (programmatic use)", async () => {
    const cwd = tmp();
    await runGenerate({ cwd, description: "a CLI tool", llm: fake() });
    expect(existsSync(join(cwd, "package.json"))).toBe(false);
  });

  it("leaves an existing project's package.json untouched", async () => {
    const cwd = tmp();
    const pkg = join(cwd, "package.json");
    writeFileSync(pkg, JSON.stringify({ name: "mine", version: "9.9.9" }));
    await runGenerate({ cwd, description: "a CLI tool", llm: fake(), ensureScaffold: true });
    expect(JSON.parse(readFileSync(pkg, "utf8")).version).toBe("9.9.9");
  });
  it("requires a description", async () => {
    await expect(runGenerate({ description: "  ", llm: fake() })).rejects.toThrow(/description/i);
  });
  it("errors clearly (no key value) when no key and no injected llm", async () => {
    const prev = process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    // Point config at an empty temp dir so no stored key is found.
    const prevCfg = process.env.PAGELATHE_CONFIG_DIR;
    process.env.PAGELATHE_CONFIG_DIR = tmp();
    try {
      await expect(runGenerate({ description: "x" })).rejects.toThrow(
        /config set-key|OPENROUTER_API_KEY/,
      );
    } finally {
      if (prev) process.env.OPENROUTER_API_KEY = prev;
      if (prevCfg) process.env.PAGELATHE_CONFIG_DIR = prevCfg;
      else delete process.env.PAGELATHE_CONFIG_DIR;
    }
  });

  it("names the chosen provider's key + env var when that key is missing", async () => {
    const prevCfg = process.env.PAGELATHE_CONFIG_DIR;
    const prevGemini = process.env.GEMINI_API_KEY;
    const prevGoogle = process.env.GOOGLE_API_KEY;
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    process.env.PAGELATHE_CONFIG_DIR = tmp();
    try {
      await expect(runGenerate({ description: "x", provider: "gemini" })).rejects.toThrow(
        /--provider gemini|GEMINI_API_KEY/,
      );
    } finally {
      if (prevCfg) process.env.PAGELATHE_CONFIG_DIR = prevCfg;
      else delete process.env.PAGELATHE_CONFIG_DIR;
      if (prevGemini) process.env.GEMINI_API_KEY = prevGemini;
      if (prevGoogle) process.env.GOOGLE_API_KEY = prevGoogle;
    }
  });
});
