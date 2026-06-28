import { describe, expect, it } from "vitest";
import { getSection, type PageDocument } from "@pagelathe/sections";
import {
  listToJson,
  renderList,
  renderPage,
  renderProps,
  renderSection,
  summarizeSections,
} from "../../src/gen/render-doc.js";

function doc(): PageDocument {
  return {
    meta: { title: "Acme", description: "Acme does X", locales: ["en"], primaryGoal: "signup" },
    theme: { tokens: {} },
    archetype: "sdk-infra",
    sections: [
      { type: "hero", id: "hero-1", props: getSection("hero")!.manifest.defaultProps },
      { type: "features", id: "features-1", props: getSection("features")!.manifest.defaultProps },
    ],
  } as PageDocument;
}

describe("summarizeSections", () => {
  it("indexes sections and exposes the hero variant", () => {
    const s = summarizeSections(doc());
    expect(s[0]).toMatchObject({ index: 1, id: "hero-1", type: "hero", variant: "code-snippet" });
    expect(s[1]).toMatchObject({ index: 2, id: "features-1", type: "features", variant: null });
  });
});

describe("renderList", () => {
  it("prints a header, numbered sections, child lines and a count", () => {
    const out = renderList(doc());
    expect(out).toContain("Acme · sdk-infra · goal: signup");
    expect(out).toContain("1. hero-1");
    expect(out).toContain("[variant: code-snippet]");
    expect(out).toContain("· ctas: Start free, View on GitHub (2)");
    expect(out).toContain("· items: Branch per PR, 1-second reset, Self-host or cloud (3)");
    expect(out.trimEnd().endsWith("2 sections")).toBe(true);
  });
});

describe("renderProps / renderSection / renderPage", () => {
  it("renders scalars aligned and arrays bulleted", () => {
    const out = renderProps({ headline: "Hi", ctas: [{ label: "Go", href: "/x" }] });
    expect(out).toContain("headline");
    expect(out).toContain("Hi");
    expect(out).toContain("ctas");
    expect(out).toContain("• label: Go");
    expect(out).toContain("href: /x");
  });

  it("renderSection shows the id, type and variant header", () => {
    const out = renderSection(doc().sections[0]);
    expect(out).toContain("hero-1  (hero, variant: code-snippet)");
    expect(out).toMatch(/─+/);
  });

  it("renderPage includes meta and every section", () => {
    const out = renderPage(doc());
    expect(out).toContain("Acme");
    expect(out).toContain("hero-1");
    expect(out).toContain("features-1");
  });
});

describe("listToJson", () => {
  it("shapes a compact, machine-readable summary", () => {
    const json = listToJson(doc());
    expect(json.meta).toEqual({ title: "Acme", primaryGoal: "signup" });
    expect(json.archetype).toBe("sdk-infra");
    expect(json.sections[0]).toMatchObject({ index: 1, id: "hero-1", variant: "code-snippet" });
    expect(json.sections[0].children).toContainEqual({
      prop: "ctas",
      count: 2,
      labels: ["Start free", "View on GitHub"],
    });
  });
});
