import { describe, expect, it } from "vitest";
import { z } from "zod";
import { stripSchemaDefaults } from "../../src/gen/strip-defaults.js";

describe("stripSchemaDefaults", () => {
  it("turns a defaulted field into a required one (no silent default)", () => {
    const stripped = stripSchemaDefaults(
      z.object({ a: z.string(), featured: z.boolean().default(false) }),
    );
    expect(() => stripped.parse({ a: "x" })).toThrow();
    expect(stripped.parse({ a: "x", featured: true })).toEqual({ a: "x", featured: true });
  });

  it("recurses into arrays and objects, preserving array length constraints", () => {
    const stripped = stripSchemaDefaults(
      z.object({
        tiers: z.array(z.object({ name: z.string(), featured: z.boolean().default(false) })).min(1),
      }),
    );
    expect(() => stripped.parse({ tiers: [{ name: "t" }] })).toThrow(); // featured now required
    expect(stripped.parse({ tiers: [{ name: "t", featured: true }] })).toEqual({
      tiers: [{ name: "t", featured: true }],
    });
    expect(() => stripped.parse({ tiers: [] })).toThrow(); // min(1) preserved
  });

  it("strips a top-level array default so the field must be echoed", () => {
    const stripped = stripSchemaDefaults(
      z.object({ links: z.array(z.string()).max(6).default([]) }),
    );
    expect(() => stripped.parse({})).toThrow();
    expect(stripped.parse({ links: ["a"] })).toEqual({ links: ["a"] });
  });

  it("keeps genuinely optional (no-default) fields optional", () => {
    const stripped = stripSchemaDefaults(z.object({ a: z.string(), note: z.string().optional() }));
    expect(stripped.parse({ a: "x" })).toEqual({ a: "x" });
    expect(stripped.parse({ a: "x", note: "n" })).toEqual({ a: "x", note: "n" });
  });

  it("makes every real section's defaulted fields required", () => {
    // a pricing tier omitting `featured` must now fail instead of silently defaulting to false
    expect(() =>
      stripSchemaDefaults(
        z.object({ tiers: z.array(z.object({ featured: z.boolean().default(false) })) }),
      ).parse({ tiers: [{}] }),
    ).toThrow();
  });
});
