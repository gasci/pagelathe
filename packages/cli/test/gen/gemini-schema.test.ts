import { describe, expect, it } from "vitest";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toGeminiSchema } from "../../src/gen/gemini-schema.js";

/** Recursively collect every object key present in a schema tree. */
function allKeys(node: unknown, acc = new Set<string>()): Set<string> {
  if (Array.isArray(node)) {
    node.forEach((n) => allKeys(n, acc));
  } else if (node && typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      acc.add(k);
      allKeys(v, acc);
    }
  }
  return acc;
}

describe("toGeminiSchema", () => {
  it("strips JSON-Schema-only keywords Gemini rejects", () => {
    const json = zodToJsonSchema(z.object({ name: z.string(), tags: z.array(z.string()) }), {
      $refStrategy: "none",
    });
    const keys = allKeys(toGeminiSchema(json));
    expect(keys.has("$schema")).toBe(false);
    expect(keys.has("additionalProperties")).toBe(false);
    expect(keys.has("$ref")).toBe(false);
  });

  it("preserves structure, properties, and enums", () => {
    const json = zodToJsonSchema(
      z.object({
        archetype: z.enum(["sdk-infra", "general"]),
        nested: z.object({ count: z.number() }),
      }),
      { $refStrategy: "none" },
    );
    const out = toGeminiSchema(json) as Record<string, unknown>;
    expect(out.type).toBe("object");
    const props = out.properties as Record<string, Record<string, unknown>>;
    expect(props.archetype.enum).toEqual(["sdk-infra", "general"]);
    expect(props.nested.type).toBe("object");
    expect((props.nested.properties as Record<string, Record<string, unknown>>).count.type).toBe(
      "number",
    );
  });

  it("folds a `null` type union into nullable", () => {
    const out = toGeminiSchema({ type: ["string", "null"], description: "x" }) as Record<
      string,
      unknown
    >;
    expect(out.type).toBe("string");
    expect(out.nullable).toBe(true);
  });

  it("folds an anyOf null branch into nullable and keeps the rest", () => {
    const out = toGeminiSchema({
      anyOf: [{ type: "string" }, { type: "null" }],
    }) as Record<string, unknown>;
    expect(out.nullable).toBe(true);
    expect(out.anyOf).toEqual([{ type: "string" }]);
  });

  it("drops additionalProperties on nested objects too", () => {
    const json = zodToJsonSchema(z.object({ outer: z.object({ inner: z.string() }) }), {
      $refStrategy: "none",
    });
    const out = toGeminiSchema(json) as Record<string, unknown>;
    const outer = (out.properties as Record<string, Record<string, unknown>>).outer;
    expect("additionalProperties" in outer).toBe(false);
  });
});
