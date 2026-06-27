import { describe, expect, it } from "vitest";
import { parsePath, getAtPath, listLeafPaths, diffLeaves } from "../src/gen/set-path.js";

describe("parsePath", () => {
  it("splits dotted paths and turns integer segments into array indices", () => {
    expect(parsePath("items.0.title")).toEqual(["items", 0, "title"]);
    expect(parsePath("headline")).toEqual(["headline"]);
  });
});

describe("getAtPath", () => {
  it("reads through objects and arrays, undefined when absent", () => {
    const v = { items: [{ title: "t" }] };
    expect(getAtPath(v, ["items", 0, "title"])).toBe("t");
    expect(getAtPath(v, ["items", 9, "title"])).toBeUndefined();
    expect(getAtPath(v, ["nope"])).toBeUndefined();
  });
});

describe("listLeafPaths", () => {
  it("enumerates scalar leaf paths through objects and arrays", () => {
    const paths = listLeafPaths({ headline: "a", items: [{ title: "t", emphasis: false }] });
    expect(paths).toEqual(["headline", "items.0.title", "items.0.emphasis"]);
  });
});

describe("diffLeaves", () => {
  it("reports changed scalar leaves across objects and arrays", () => {
    const before = { headline: "a", items: [{ title: "t", emphasis: false }] };
    const after = { headline: "A", items: [{ title: "t", emphasis: true }] };
    expect(diffLeaves(before, after)).toEqual([
      { path: "headline", from: "a", to: "A" },
      { path: "items.0.emphasis", from: false, to: true },
    ]);
  });
  it("returns an empty list when nothing changed", () => {
    const v = { headline: "a", n: 1 };
    expect(diffLeaves(v, { headline: "a", n: 1 })).toEqual([]);
  });
  it("captures added and removed leaves", () => {
    expect(diffLeaves({ a: 1 }, { a: 1, b: 2 })).toEqual([{ path: "b", from: undefined, to: 2 }]);
    expect(diffLeaves({ a: 1, b: 2 }, { a: 1 })).toEqual([{ path: "b", from: 2, to: undefined }]);
  });

  it("handles array grow, shrink, and empty↔populated transitions", () => {
    // shrink: dropped element shows from→undefined
    expect(diffLeaves({ items: [{ t: "a" }, { t: "b" }] }, { items: [{ t: "a" }] })).toEqual([
      { path: "items.1.t", from: "b", to: undefined },
    ]);
    // grow: new element shows undefined→to
    expect(diffLeaves({ items: [{ t: "a" }] }, { items: [{ t: "a" }, { t: "b" }] })).toEqual([
      { path: "items.1.t", from: undefined, to: "b" },
    ]);
    // empty → populated (an empty array contributes no leaf paths)
    expect(diffLeaves({ links: [] }, { links: ["x"] })).toEqual([
      { path: "links.0", from: undefined, to: "x" },
    ]);
  });

  it("reports a reorder positionally", () => {
    expect(diffLeaves({ items: ["a", "b"] }, { items: ["b", "a"] })).toEqual([
      { path: "items.0", from: "a", to: "b" },
      { path: "items.1", from: "b", to: "a" },
    ]);
  });
});
