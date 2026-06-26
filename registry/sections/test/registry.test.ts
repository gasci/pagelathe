import { describe, expect, it } from "vitest";
import { listSections, getSection } from "../src/registry.js";

describe("registry (Task 1 baseline)", () => {
  it("starts empty and grows as sections register", () => {
    // Task 1: no sections yet. Later tasks add entries; this asserts the API shape.
    expect(Array.isArray(listSections())).toBe(true);
  });
  it("getSection returns undefined for unknown types", () => {
    expect(getSection("does-not-exist")).toBeUndefined();
  });
});
