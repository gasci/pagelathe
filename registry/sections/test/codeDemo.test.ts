import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../codeDemo/schema.js";
import CodeDemo from "../codeDemo/section.astro";
import { renderToHtml } from "../src/render-harness.js";

describe("codeDemo", () => {
  it("validates defaultProps", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
  });
  it("renders a tab per snippet and highlights code (shiki <pre>)", async () => {
    const html = await renderToHtml(CodeDemo, propsSchema.parse(manifest.defaultProps));
    expect(html).toContain('role="tablist"');
    expect((html.match(/role="tab"/g) ?? []).length).toBe(3);
    expect(html).toContain("<pre");
  });
});
