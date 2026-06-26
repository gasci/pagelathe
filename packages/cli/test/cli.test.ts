import { describe, it, expect } from "vitest";
import { buildProgram } from "../src/index.js";
import { getVersion } from "../src/version.js";

describe("cli program", () => {
  it("is named pagelathe", () => {
    expect(buildProgram().name()).toBe("pagelathe");
  });

  it("reports a semver-shaped version", () => {
    expect(getVersion()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
