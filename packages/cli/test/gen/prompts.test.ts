import { describe, expect, it } from "vitest";
import { BANNED_WORDS, BRAND_RULES, fillSystem } from "../../src/gen/prompts.js";

describe("prompts", () => {
  it("BRAND_RULES names every banned word", () => {
    for (const w of BANNED_WORDS) expect(BRAND_RULES).toContain(w);
  });
  it("fillSystem embeds the section type, archetype, and brand rules", () => {
    const s = fillSystem("hero", "sdk-infra");
    expect(s).toContain("hero");
    expect(s).toContain("sdk-infra");
    expect(s).toContain("Anti-fluff");
  });
});
