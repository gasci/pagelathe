import { describe, expect, it } from "vitest";
import Header from "../header/section.astro";
import Features from "../features/section.astro";
import Pricing from "../pricing/section.astro";
import FinalCta from "../finalCta/section.astro";
import Footer from "../footer/section.astro";
import * as header from "../header/schema.js";
import * as features from "../features/schema.js";
import * as pricing from "../pricing/schema.js";
import * as finalCta from "../finalCta/schema.js";
import * as footer from "../footer/schema.js";
import { renderToHtml } from "../src/render-harness.js";

const cases = [
  { name: "header", C: Header, m: header },
  { name: "features", C: Features, m: features },
  { name: "pricing", C: Pricing, m: pricing },
  { name: "finalCta", C: FinalCta, m: finalCta },
  { name: "footer", C: Footer, m: footer },
];

describe("section theme tokens", () => {
  for (const { name, C, m } of cases) {
    it(`${name} uses semantic tokens, no hardcoded dark classes`, async () => {
      const html = await renderToHtml(C, m.propsSchema.parse(m.manifest.defaultProps));
      expect(html, name).not.toContain("text-white");
      expect(html, name).not.toContain("bg-black");
      expect(html, name).not.toContain("border-white");
      expect(html, name).not.toContain("bg-white");
      expect(html, name).toContain("text-fg");
    });
  }
});
