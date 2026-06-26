import { describe, expect, it } from "vitest";
import * as header from "../header/schema.js";
import * as footer from "../footer/schema.js";
import Header from "../header/section.astro";
import Footer from "../footer/section.astro";
import { renderToHtml } from "../src/render-harness.js";
import { checkA11y } from "../src/a11y.js";

describe("header", () => {
  it("validates defaultProps", () => {
    expect(header.propsSchema.safeParse(header.manifest.defaultProps).success).toBe(true);
  });
  it("renders a nav landmark and brand", async () => {
    const html = await renderToHtml(Header, header.propsSchema.parse(header.manifest.defaultProps));
    expect(html).toContain("Branchy");
    expect(checkA11y(html, { landmarks: ["nav"], linksHaveText: true })).toEqual([]);
  });
});

describe("footer", () => {
  it("validates defaultProps", () => {
    expect(footer.propsSchema.safeParse(footer.manifest.defaultProps).success).toBe(true);
  });
  it("renders a footer landmark and copyright", async () => {
    const html = await renderToHtml(Footer, footer.propsSchema.parse(footer.manifest.defaultProps));
    expect(html).toContain("Apache-2.0");
    expect(checkA11y(html, { landmarks: ["footer"], linksHaveText: true })).toEqual([]);
  });
});
