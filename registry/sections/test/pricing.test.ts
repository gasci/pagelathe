import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../pricing/schema.js";
import Pricing from "../pricing/section.astro";
import { renderToHtml } from "../src/render-harness.js";

describe("pricing", () => {
  it("validates defaultProps and requires >=1 feature per tier", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
    const bad = {
      heading: "H",
      tiers: [
        { name: "x", price: "$0", description: "d", features: [], cta: { label: "a", href: "#" } },
      ],
    };
    expect(propsSchema.safeParse(bad).success).toBe(false);
  });
  it("renders tier names and prices", async () => {
    const html = await renderToHtml(Pricing, propsSchema.parse(manifest.defaultProps));
    expect(html).toContain("Open source");
    expect(html).toContain("$29");
  });
});
