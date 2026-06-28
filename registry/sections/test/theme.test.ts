import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  fileURLToPath(new URL("../../app/src/styles/global.css", import.meta.url)),
  "utf8",
);

describe("global.css theme tokens", () => {
  it("defines all semantic color tokens in @theme", () => {
    for (const token of [
      "--color-bg",
      "--color-fg",
      "--color-muted",
      "--color-border",
      "--color-surface",
      "--color-primary",
      "--color-on-primary",
    ]) {
      expect(css).toContain(token);
    }
  });

  it("provides a light default and a dark override (media query + class)", () => {
    expect(css).toContain("color-scheme: light");
    expect(css).toContain("@media (prefers-color-scheme: dark)");
    expect(css).toContain(":root.dark");
    expect(css).toContain("color-scheme: dark");
  });

  it("maps Shiki dark variables in dark scope", () => {
    expect(css).toContain("--shiki-dark");
  });

  it("drives body colors from tokens, not hardcoded hex", () => {
    expect(css).toMatch(/body\s*\{[^}]*background-color:\s*var\(--bg\)/);
    expect(css).toMatch(/body\s*\{[^}]*color:\s*var\(--fg\)/);
  });
});

const base = readFileSync(
  fileURLToPath(new URL("../../app/src/layouts/Base.astro", import.meta.url)),
  "utf8",
);

describe("Base.astro theme switching", () => {
  it("has a no-flash inline script reading persisted theme", () => {
    expect(base).toContain("is:inline");
    expect(base).toContain("localStorage.getItem(\"theme\")");
    expect(base).toContain("classList");
  });

  it("renders an accessible toggle button", () => {
    expect(base).toContain("id=\"theme-toggle\"");
    expect(base).toContain("aria-label");
  });

  it("toggle persists the choice and respects system preference", () => {
    expect(base).toContain("localStorage.setItem(\"theme\"");
    expect(base).toContain("prefers-color-scheme: dark");
  });
});
