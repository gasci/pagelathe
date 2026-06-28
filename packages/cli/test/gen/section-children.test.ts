import { describe, expect, it } from "vitest";
import { getSection } from "@pagelathe/sections";
import { summarizeChildren } from "../../src/gen/section-children.js";

describe("summarizeChildren", () => {
  it("summarizes each array prop with up to 3 labels and the full count", () => {
    const out = summarizeChildren(getSection("features")!.manifest.defaultProps);
    expect(out).toContainEqual({
      prop: "items",
      count: 3,
      labels: ["Branch per PR", "1-second reset", "Self-host or cloud"],
    });
  });

  it("uses each section's natural label field", () => {
    const ctas = summarizeChildren(getSection("hero")!.manifest.defaultProps).find(
      (c) => c.prop === "ctas",
    );
    expect(ctas).toEqual({ prop: "ctas", count: 2, labels: ["Start free", "View on GitHub"] });
    const tiers = summarizeChildren(getSection("pricing")!.manifest.defaultProps).find(
      (c) => c.prop === "tiers",
    );
    expect(tiers).toEqual({ prop: "tiers", count: 2, labels: ["Open source", "Team"] });
  });

  it("caps labels at 3 but keeps the true count", () => {
    const props = { items: [{ title: "a" }, { title: "b" }, { title: "c" }, { title: "d" }] };
    expect(summarizeChildren(props)).toEqual([
      { prop: "items", count: 4, labels: ["a", "b", "c"] },
    ]);
  });

  it("handles string-array items and falls back to item N", () => {
    expect(summarizeChildren({ features: ["Self-hosted", "Community"] })).toEqual([
      { prop: "features", count: 2, labels: ["Self-hosted", "Community"] },
    ]);
    expect(summarizeChildren({ rows: [{ qty: 1 }, { qty: 2 }] })).toEqual([
      { prop: "rows", count: 2, labels: ["item 1", "item 2"] },
    ]);
  });

  it("returns [] for sections with no array props or non-object input", () => {
    expect(summarizeChildren(getSection("finalCta")!.manifest.defaultProps)).toEqual([]);
    expect(summarizeChildren(null)).toEqual([]);
    expect(summarizeChildren("x")).toEqual([]);
  });
});
