import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml, readDocumentYaml } from "../../src/gen/yaml-doc.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-yaml-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function sampleDoc() {
  return {
    meta: { title: "B — x", description: "d", locales: ["en"], primaryGoal: "signup" },
    theme: { tokens: {} },
    archetype: "general",
    sections: [{ type: "hero", id: "hero-1", props: getSection("hero")!.manifest.defaultProps }],
  };
}

describe("readDocumentYaml", () => {
  it("round-trips a written document", () => {
    const file = join(tmp(), "index.yaml");
    writeDocumentYaml(sampleDoc(), file);
    const doc = readDocumentYaml(file);
    expect(doc.sections[0].id).toBe("hero-1");
  });
  it("throws a helpful error when the file is missing", () => {
    expect(() => readDocumentYaml(join(tmp(), "nope.yaml"))).toThrow(/pagelathe generate/);
  });
});
