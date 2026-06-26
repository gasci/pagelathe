import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../footer/schema.js";

describe("footer", () => {
  it("validates defaultProps", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
  });

  it("keeps footer text short — rejects an over-long tagline or copyright", () => {
    const base = propsSchema.parse(manifest.defaultProps);
    const long = "x".repeat(200);
    expect(propsSchema.safeParse({ ...base, tagline: long }).success).toBe(false);
    expect(propsSchema.safeParse({ ...base, copyright: long }).success).toBe(false);
  });

  it("bounds column heading and link label length", () => {
    const base = propsSchema.parse(manifest.defaultProps);
    const longHeading = {
      ...base,
      columns: [{ heading: "x".repeat(50), links: [{ label: "a", href: "#" }] }],
    };
    expect(propsSchema.safeParse(longHeading).success).toBe(false);
    const longLabel = {
      ...base,
      columns: [{ heading: "Product", links: [{ label: "x".repeat(50), href: "#" }] }],
    };
    expect(propsSchema.safeParse(longLabel).success).toBe(false);
  });
});
