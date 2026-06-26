import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../features/schema.js";
import Features from "../features/section.astro";
import { renderToHtml } from "../src/render-harness.js";

describe("features", () => {
  it("validates defaultProps and requires >=2 items", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
    expect(
      propsSchema.safeParse({ heading: "H", items: [{ title: "x", body: "y" }] }).success,
    ).toBe(false);
  });
  it("renders all feature titles", async () => {
    const html = await renderToHtml(Features, propsSchema.parse(manifest.defaultProps));
    expect(html).toContain("Branch per PR");
    expect(html).toContain("1-second reset");
  });
});
