import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { fillSection, deriveMeta } from "../../src/gen/fill.js";
import { getSection } from "@pagelathe/sections";
import type { LlmClient } from "../../src/gen/llm.js";

// The fake echoes each section's own defaultProps, proving fillSection validates
// against the real per-section schema (keystone consumer #2).
function fakeFromDefaults(): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>, opts) => {
      const name = opts.schemaName ?? "";
      if (name === "page_meta") {
        return Promise.resolve(
          schema.parse({ title: "B — x", description: "d", primaryGoal: "signup", brand: "B" }),
        );
      }
      const type = name.replace(/_props$/, "");
      const def = getSection(type)?.manifest.defaultProps;
      return Promise.resolve(schema.parse(def));
    },
  };
}

describe("fillSection", () => {
  it("returns props that validate against the section's own schema", async () => {
    const props = await fillSection(
      { type: "hero", description: "db", archetype: "sdk-infra", brand: "B" },
      fakeFromDefaults(),
    );
    expect(getSection("hero")!.propsSchema.safeParse(props).success).toBe(true);
  });
  it("throws on an unknown section type", async () => {
    await expect(
      // @ts-expect-error intentional invalid type
      fillSection(
        { type: "nope", description: "x", archetype: "general", brand: "B" },
        fakeFromDefaults(),
      ),
    ).rejects.toThrow(/Unknown section/);
  });
});

describe("deriveMeta", () => {
  it("returns validated meta", async () => {
    const m = await deriveMeta({ description: "db" }, fakeFromDefaults());
    expect(m.brand).toBe("B");
    expect(m.primaryGoal).toBe("signup");
  });
});
