import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { planSections } from "../../src/gen/planner.js";
import type { LlmClient } from "../../src/gen/llm.js";

function fake(sections: string[]): LlmClient {
  return { generateObject: <T>(schema: ZodType<T>) => Promise.resolve(schema.parse({ sections })) };
}

describe("planSections", () => {
  it("forces required sections + canonical order even if the model omits/reorders", async () => {
    const out = await planSections(
      { description: "db", archetype: "sdk-infra" },
      fake(["footer", "hero"]),
    );
    expect(out[0]).toBe("header");
    expect(out[out.length - 1]).toBe("footer");
    for (const r of ["header", "hero", "features", "pricing", "finalCta", "footer"])
      expect(out).toContain(r);
    expect(out).toContain("codeDemo"); // sdk-infra
  });
  it("omits codeDemo for general archetype unless chosen", async () => {
    const out = await planSections({ description: "x", archetype: "general" }, fake(["hero"]));
    expect(out).not.toContain("codeDemo");
  });
});
