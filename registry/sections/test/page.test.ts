import { describe, expect, it } from "vitest";
import { metaSchema, themeSchema, archetypeSchema, buildPageDocumentSchema } from "../src/page.js";
import { z } from "zod";

describe("metaSchema", () => {
  it("defaults locales and primaryGoal", () => {
    const m = metaSchema.parse({ title: "T", description: "D" });
    expect(m.locales).toEqual(["en"]);
    expect(m.primaryGoal).toBe("signup");
  });
  it("rejects empty title", () => {
    expect(metaSchema.safeParse({ title: "", description: "D" }).success).toBe(false);
  });
});

describe("themeSchema", () => {
  it("fills token defaults", () => {
    const t = themeSchema.parse({ tokens: {} });
    expect(t.tokens.radius).toBe("0.5rem");
    expect(t.tokens.font).toBe("Inter");
  });
});

describe("buildPageDocumentSchema", () => {
  const entry = z.object({
    type: z.literal("hero"),
    id: z.string(),
    props: z.object({ headline: z.string() }),
  });
  const doc = buildPageDocumentSchema([entry]);

  it("accepts a valid one-section document", () => {
    const r = doc.safeParse({
      meta: { title: "T", description: "D" },
      sections: [{ type: "hero", id: "h1", props: { headline: "Hi" } }],
    });
    expect(r.success).toBe(true);
  });
  it("rejects an empty sections array", () => {
    const r = doc.safeParse({ meta: { title: "T", description: "D" }, sections: [] });
    expect(r.success).toBe(false);
  });
  it("rejects an unknown section type", () => {
    const r = doc.safeParse({
      meta: { title: "T", description: "D" },
      sections: [{ type: "nope", id: "x", props: {} }],
    });
    expect(r.success).toBe(false);
  });
});

describe("archetypeSchema", () => {
  it("accepts the three archetypes", () => {
    for (const a of ["sdk-infra", "technical-app", "general"]) {
      expect(archetypeSchema.safeParse(a).success).toBe(true);
    }
  });
});
