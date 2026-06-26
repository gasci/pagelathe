import { describe, expect, it } from "vitest";
import { propsSchema, manifest, entrySchema } from "../hero/schema.js";
import Hero from "../hero/section.astro";
import { renderToHtml } from "../src/render-harness.js";
import { checkA11y } from "../src/a11y.js";

describe("hero schema", () => {
  it("validates its own defaultProps", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
  });
  it("requires at least one CTA", () => {
    const bad = { ...(manifest.defaultProps as object), ctas: [] };
    expect(propsSchema.safeParse(bad).success).toBe(false);
  });
  it("entrySchema pins the type literal", () => {
    expect(
      entrySchema.safeParse({ type: "header", id: "x", props: manifest.defaultProps }).success,
    ).toBe(false);
  });
});

describe("hero render", () => {
  it("renders headline + CTA and passes basic a11y", async () => {
    const props = propsSchema.parse(manifest.defaultProps);
    const html = await renderToHtml(Hero, props);
    expect(html).toContain("Postgres branching for teams");
    expect(html).toContain("Start free");
    expect(checkA11y(html, { linksHaveText: true, imagesHaveAlt: true })).toEqual([]);
  });
});
