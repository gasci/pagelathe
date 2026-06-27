import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parsePath, coerceValue, applySet, getAtPath, listLeafPaths } from "../src/gen/set-path.js";

const schema = z.object({
  headline: z.string().min(1),
  variant: z.enum(["code-snippet", "product-ui"]).default("code-snippet"),
  eyebrow: z.string().optional(),
  count: z.number().default(1),
  items: z.array(z.object({ title: z.string(), emphasis: z.boolean().default(false) })).min(1),
});

describe("parsePath", () => {
  it("splits dotted paths and turns integer segments into array indices", () => {
    expect(parsePath("items.0.title")).toEqual(["items", 0, "title"]);
    expect(parsePath("headline")).toEqual(["headline"]);
  });
});

describe("coerceValue", () => {
  it("coerces by the schema's declared type", () => {
    expect(coerceValue(schema, ["headline"], "Hi")).toBe("Hi");
    expect(coerceValue(schema, ["count"], "3")).toBe(3);
    expect(coerceValue(schema, ["items", 0, "emphasis"], "true")).toBe(true);
    expect(coerceValue(schema, ["variant"], "product-ui")).toBe("product-ui");
    expect(coerceValue(schema, ["eyebrow"], "New")).toBe("New"); // optional unwrapped
  });
  it("rejects bad numbers, booleans, enums, and unknown fields", () => {
    expect(() => coerceValue(schema, ["count"], "x")).toThrow(/number/);
    expect(() => coerceValue(schema, ["items", 0, "emphasis"], "yes")).toThrow(/true\/false/);
    expect(() => coerceValue(schema, ["variant"], "nope")).toThrow(/code-snippet/);
    expect(() => coerceValue(schema, ["nope"], "x")).toThrow(/Unknown field/);
  });
});

describe("applySet / getAtPath", () => {
  it("overwrites a leaf immutably and reads it back", () => {
    const props = { headline: "a", items: [{ title: "t", emphasis: false }] };
    const next = applySet(props, ["items", 0, "title"], "T");
    expect(getAtPath(next, ["items", 0, "title"])).toBe("T");
    expect(props.items[0].title).toBe("t"); // original untouched
  });
  it("can set an optional leaf field that is currently absent", () => {
    const next = applySet({ headline: "a" }, ["eyebrow"], "New");
    expect(getAtPath(next, ["eyebrow"])).toBe("New");
  });
  it("rejects out-of-range array index and missing parent", () => {
    expect(() => applySet({ items: [{ title: "t" }] }, ["items", 5, "title"], "x")).toThrow(
      /range/,
    );
    expect(() => applySet({}, ["code", "lang"], "bash")).toThrow(/code/);
  });
});

describe("listLeafPaths", () => {
  it("enumerates scalar leaf paths through objects and arrays", () => {
    const paths = listLeafPaths({ headline: "a", items: [{ title: "t", emphasis: false }] });
    expect(paths).toEqual(["headline", "items.0.title", "items.0.emphasis"]);
  });
});
