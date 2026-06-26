import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { listAvailableSections, sectionComponentPath, getAppDir } from "../src/registry/read.js";
import { RegistryError } from "../src/registry/paths.js";

describe("registry reader", () => {
  it("lists the M2 section set with required flags", () => {
    const types = listAvailableSections().map((s) => s.type);
    expect(types).toContain("hero");
    expect(types).toContain("footer");
    expect(listAvailableSections().find((s) => s.type === "hero")?.required).toBe(true);
  });
  it("resolves an existing component file for a known section", () => {
    expect(existsSync(sectionComponentPath("hero"))).toBe(true);
  });
  it("throws RegistryError for an unknown section", () => {
    expect(() => sectionComponentPath("nope")).toThrow(RegistryError);
  });
  it("resolves an app dir that exists", () => {
    expect(existsSync(getAppDir())).toBe(true);
  });
});
