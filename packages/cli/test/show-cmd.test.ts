import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml } from "../src/gen/yaml-doc.js";
import { runShow } from "../src/commands/show-cmd.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-show-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function project(): string {
  const cwd = tmp();
  const doc = {
    meta: { title: "Acme", description: "d", locales: ["en"], primaryGoal: "signup" },
    theme: { tokens: {} },
    archetype: "general",
    sections: [
      { type: "hero", id: "hero-1", props: getSection("hero")!.manifest.defaultProps },
      { type: "features", id: "features-1", props: getSection("features")!.manifest.defaultProps },
    ],
  };
  writeDocumentYaml(doc, join(cwd, "src", "content", "landing", "index.yaml"));
  return cwd;
}

describe("runShow", () => {
  it("returns the whole doc when no id is given", () => {
    const { doc, section } = runShow({ cwd: project() });
    expect(section).toBeUndefined();
    expect(doc.sections).toHaveLength(2);
  });

  it("returns one section by id", () => {
    const { section } = runShow({ cwd: project(), sectionId: "hero-1" });
    expect(section!.type).toBe("hero");
  });

  it("throws listing available ids for an unknown section", () => {
    expect(() => runShow({ cwd: project(), sectionId: "nope" })).toThrow(
      /No section with id "nope". Available ids: hero-1, features-1/,
    );
  });
});
