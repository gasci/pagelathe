import { describe, expect, it } from "vitest";
import { listSections, getSection, pageDocumentSchema } from "../src/registry.js";

const EXPECTED = ["header", "hero", "features", "codeDemo", "pricing", "finalCta", "footer"];

describe("registry completeness", () => {
  it("registers exactly the M2 section set", () => {
    const types = listSections()
      .map((s) => s.manifest.type)
      .sort();
    expect(types).toEqual([...EXPECTED].sort());
  });
  it("every manifest.defaultProps validates against its own propsSchema", () => {
    for (const s of listSections()) {
      const r = s.propsSchema.safeParse(s.manifest.defaultProps);
      expect(r.success, `${s.manifest.type} defaultProps invalid`).toBe(true);
    }
  });
  it("every manifest.componentFile is section.astro and type matches dir", () => {
    for (const s of listSections()) {
      expect(s.manifest.componentFile).toBe("section.astro");
      expect(getSection(s.manifest.type)).toBe(s);
    }
  });
  it("pageDocumentSchema accepts a full document built from defaultProps", () => {
    const doc = {
      meta: { title: "T", description: "D" },
      theme: { tokens: {} },
      archetype: "sdk-infra",
      sections: listSections().map((s, i) => ({
        type: s.manifest.type,
        id: `${s.manifest.type}-${i}`,
        props: s.manifest.defaultProps,
      })),
    };
    expect(pageDocumentSchema.safeParse(doc).success).toBe(true);
  });
});
