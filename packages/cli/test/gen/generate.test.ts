import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type { ZodType } from "zod";
import { generate } from "../../src/gen/generate.js";
import { getSection, pageDocumentSchema } from "@pagelathe/sections";
import type { LlmClient, LlmGenerateOptions } from "../../src/gen/llm.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-gen-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function fake(): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>, opts: LlmGenerateOptions) => {
      const name = opts.schemaName ?? "";
      if (name === "archetype")
        return Promise.resolve(schema.parse({ archetype: "sdk-infra", reason: "r" }));
      if (name === "page_meta")
        return Promise.resolve(
          schema.parse({ title: "B — db", description: "d", primaryGoal: "signup", brand: "B" }),
        );
      if (name === "section_plan") return Promise.resolve(schema.parse({ sections: ["hero"] }));
      const type = name.replace(/_props$/, "");
      return Promise.resolve(schema.parse(getSection(type)!.manifest.defaultProps));
    },
  };
}

/** Like fake(), but returns schema-invalid props for `badType` to simulate a
 *  mid-pipeline fill failure. */
function fakeFailingOn(badType: string): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>, opts: LlmGenerateOptions) => {
      const name = opts.schemaName ?? "";
      if (name === "archetype")
        return Promise.resolve(schema.parse({ archetype: "general", reason: "r" }));
      if (name === "page_meta")
        return Promise.resolve(
          schema.parse({ title: "B — x", description: "d", primaryGoal: "signup", brand: "B" }),
        );
      if (name === "section_plan") return Promise.resolve(schema.parse({ sections: ["hero"] }));
      const type = name.replace(/_props$/, "");
      const value = type === badType ? {} : getSection(type)!.manifest.defaultProps;
      return Promise.resolve(schema.parse(value));
    },
  };
}

describe("generate", () => {
  it("writes a schema-valid index.yaml and vendors the planned sections", async () => {
    const cwd = tmp();
    const res = await generate({ description: "a Postgres driver", cwd, llm: fake() });
    // index.yaml exists and re-validates
    const raw = readFileSync(res.yamlPath, "utf8");
    expect(pageDocumentSchema.safeParse(parseYaml(raw)).success).toBe(true);
    // required sections forced by the planner are present + vendored
    for (const t of ["header", "hero", "features", "pricing", "finalCta", "footer", "codeDemo"]) {
      expect(res.vendored).toContain(t);
      expect(existsSync(join(cwd, "src", "components", "sections", `${t}.astro`))).toBe(true);
    }
    expect(res.document.archetype).toBe("sdk-infra");
  });

  it("writes nothing when a section fails to fill (last-good preserved)", async () => {
    const cwd = tmp();
    await expect(
      generate({ description: "x", cwd, llm: fakeFailingOn("hero") }),
    ).rejects.toBeTruthy();
    // The pipeline throws before any file write: no document, no vendored sections.
    expect(existsSync(join(cwd, "src", "content", "landing", "index.yaml"))).toBe(false);
    expect(existsSync(join(cwd, "src", "components", "sections"))).toBe(false);
  });
});
