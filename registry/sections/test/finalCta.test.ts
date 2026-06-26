import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../finalCta/schema.js";
import FinalCta from "../finalCta/section.astro";
import { renderToHtml } from "../src/render-harness.js";

describe("finalCta", () => {
  it("validates defaultProps", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
  });
  it("renders headline and CTA", async () => {
    const html = await renderToHtml(FinalCta, propsSchema.parse(manifest.defaultProps));
    expect(html).toContain("Ship your first branch today");
    expect(html).toContain("Start free");
  });
});
