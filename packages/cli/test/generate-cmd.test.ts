import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
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
});
