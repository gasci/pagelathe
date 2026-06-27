import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { getSection } from "@pagelathe/sections";
import { editSection } from "../../src/gen/edit-section.js";
import type { LlmClient } from "../../src/gen/llm.js";

describe("editSection", () => {
  it("passes the section's propsSchema to the LLM and returns the validated object", async () => {
    const current = getSection("hero")!.manifest.defaultProps as { headline: string };
    let seenSchemaName: string | undefined;
    let seenPrompt = "";
    const llm: LlmClient = {
      generateObject: <T>(schema: ZodType<T>, opts) => {
        seenSchemaName = opts.schemaName;
        seenPrompt = opts.prompt;
        return Promise.resolve(schema.parse({ ...current, headline: "New headline" }));
      },
    };
    const result = (await editSection(
      {
        type: "hero",
        currentProps: current,
        instruction: "make the headline punchier",
        archetype: "general",
        product: "Branchy",
      },
      llm,
    )) as { headline: string };
    expect(result.headline).toBe("New headline");
    expect(seenSchemaName).toBe("hero_props");
    // the current props and the instruction are both in the prompt
    expect(seenPrompt).toContain("make the headline punchier");
    expect(seenPrompt).toContain(current.headline);
  });

  it("hands the model a schema that rejects dropped defaulted fields (no silent loss)", async () => {
    const current = getSection("pricing")!.manifest.defaultProps;
    // A well-behaved model echoes every field (defaults applied → all present).
    const complete = getSection("pricing")!.propsSchema.parse(current);
    let captured: ZodType<unknown> | undefined;
    const llm: LlmClient = {
      generateObject: <T>(schema: ZodType<T>) => {
        captured = schema as ZodType<unknown>;
        return Promise.resolve(complete as T);
      },
    };
    await editSection(
      {
        type: "pricing",
        currentProps: current,
        instruction: "change the Team price to $39",
        archetype: "general",
        product: "Branchy",
      },
      llm,
    );
    // pricing tiers[].featured is `.default(false)`; the hardened schema must
    // reject a tier that omits it rather than silently defaulting to false.
    expect(() => captured!.parse({ tiers: [{ name: "t" }] })).toThrow();
  });

  it("throws on an unknown section type", async () => {
    const llm: LlmClient = { generateObject: () => Promise.reject(new Error("unused")) };
    await expect(
      editSection(
        { type: "nope", currentProps: {}, instruction: "x", archetype: "general", product: "P" },
        llm,
      ),
    ).rejects.toThrow(/Unknown section/);
  });
});
