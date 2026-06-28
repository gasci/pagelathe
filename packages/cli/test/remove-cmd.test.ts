import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml, readDocumentYaml } from "../src/gen/yaml-doc.js";
import { runRemove } from "../src/commands/remove-cmd.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-remove-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function project(ids = ["hero-1", "features-1"]): string {
  const cwd = tmp();
  const doc = {
    meta: { title: "Acme", description: "d", locales: ["en"], primaryGoal: "signup" },
    theme: { tokens: {} },
    archetype: "general",
    sections: ids.map((id) => {
      const type = id.replace(/-\d+$/, "");
      return { type, id, props: getSection(type)!.manifest.defaultProps };
    }),
  };
  writeDocumentYaml(doc, join(cwd, "src", "content", "landing", "index.yaml"));
  return cwd;
}

describe("runRemove", () => {
  it("removes a section and rewrites the doc", () => {
    const cwd = project();
    const res = runRemove({ cwd, sectionId: "features-1" });
    expect(res.removedId).toBe("features-1");
    expect(res.typeStillUsed).toBe(false);
    const doc = readDocumentYaml(join(cwd, "src", "content", "landing", "index.yaml"));
    expect(doc.sections.map((s) => s.id)).toEqual(["hero-1"]);
  });

  it("reports typeStillUsed when a sibling shares the type", () => {
    const res = runRemove({ cwd: project(["hero-1", "hero-2"]), sectionId: "hero-1" });
    expect(res.typeStillUsed).toBe(true);
  });

  it("refuses to remove the last section and leaves the file untouched", () => {
    const cwd = project(["hero-1"]);
    const yamlFile = join(cwd, "src", "content", "landing", "index.yaml");
    expect(() => runRemove({ cwd, sectionId: "hero-1" })).toThrow(/Cannot remove the last section/);
    expect(readDocumentYaml(yamlFile).sections).toHaveLength(1);
  });

  it("throws listing ids for an unknown section", () => {
    expect(() => runRemove({ cwd: project(), sectionId: "nope" })).toThrow(
      /No section with id "nope". Available ids: hero-1, features-1/,
    );
  });
});
