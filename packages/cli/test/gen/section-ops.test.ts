import { describe, expect, it } from "vitest";
import { getSection, type PageDocument } from "@pagelathe/sections";
import {
  addSection,
  findSection,
  nextSectionId,
  removeSection,
} from "../../src/gen/section-ops.js";

function doc(): PageDocument {
  return {
    meta: { title: "T", description: "d", locales: ["en"], primaryGoal: "signup" },
    theme: { tokens: {} },
    archetype: "general",
    sections: [
      { type: "hero", id: "hero-1", props: getSection("hero")!.manifest.defaultProps },
      { type: "features", id: "features-1", props: getSection("features")!.manifest.defaultProps },
    ],
  } as PageDocument;
}

function entry(type: string, id: string) {
  return { type, id, props: getSection(type)!.manifest.defaultProps } as PageDocument["sections"][number];
}

describe("findSection / nextSectionId", () => {
  it("finds by id and computes the next free id", () => {
    expect(findSection(doc(), "hero-1")!.type).toBe("hero");
    expect(findSection(doc(), "nope")).toBeUndefined();
    expect(nextSectionId(doc(), "pricing")).toBe("pricing-1");
    expect(nextSectionId(doc(), "hero")).toBe("hero-2");
  });
});

describe("addSection", () => {
  it("appends to the end by default and does not mutate the input", () => {
    const d = doc();
    const { doc: next, position, total } = addSection(d, entry("pricing", "pricing-1"));
    expect(next.sections.map((s) => s.id)).toEqual(["hero-1", "features-1", "pricing-1"]);
    expect([position, total]).toEqual([3, 3]);
    expect(d.sections).toHaveLength(2); // input untouched
  });

  it("places --before and --after a target id", () => {
    const before = addSection(doc(), entry("pricing", "pricing-1"), { before: "hero-1" });
    expect(before.doc.sections.map((s) => s.id)).toEqual(["pricing-1", "hero-1", "features-1"]);
    expect(before.position).toBe(1);
    const after = addSection(doc(), entry("pricing", "pricing-1"), { after: "hero-1" });
    expect(after.doc.sections.map((s) => s.id)).toEqual(["hero-1", "pricing-1", "features-1"]);
    expect(after.position).toBe(2);
  });

  it("throws for an unknown anchor or both before+after", () => {
    expect(() => addSection(doc(), entry("pricing", "pricing-1"), { before: "x" })).toThrow(
      /No section with id "x". Available ids: hero-1, features-1/,
    );
    expect(() =>
      addSection(doc(), entry("pricing", "pricing-1"), { before: "hero-1", after: "hero-1" }),
    ).toThrow(/only one of --before/);
  });
});

describe("removeSection", () => {
  it("removes by id, reports whether the type is still used, no mutation", () => {
    const d = doc();
    const { doc: next, removed, typeStillUsed } = removeSection(d, "features-1");
    expect(next.sections.map((s) => s.id)).toEqual(["hero-1"]);
    expect(removed.id).toBe("features-1");
    expect(typeStillUsed).toBe(false);
    expect(d.sections).toHaveLength(2);
  });

  it("reports typeStillUsed when another section shares the removed type", () => {
    const twoHeroes = {
      ...doc(),
      sections: [entry("hero", "hero-1"), entry("hero", "hero-2")],
    } as PageDocument;
    const { doc: next, removed, typeStillUsed } = removeSection(twoHeroes, "hero-1");
    expect(removed.id).toBe("hero-1");
    expect(typeStillUsed).toBe(true);
    expect(next.sections.map((s) => s.id)).toEqual(["hero-2"]);
  });

  it("throws on unknown id and on removing the last section", () => {
    expect(() => removeSection(doc(), "nope")).toThrow(/No section with id "nope"/);
    const one = { ...doc(), sections: [doc().sections[0]] } as PageDocument;
    expect(() => removeSection(one, "hero-1")).toThrow(/Cannot remove the last section/);
  });
});
