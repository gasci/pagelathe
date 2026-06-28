import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml } from "../src/gen/yaml-doc.js";
import { runList } from "../src/commands/list-cmd.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-list-"));
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
    archetype: "sdk-infra",
    sections: [
      { type: "hero", id: "hero-1", props: getSection("hero")!.manifest.defaultProps },
      { type: "features", id: "features-1", props: getSection("features")!.manifest.defaultProps },
    ],
  };
  writeDocumentYaml(doc, join(cwd, "src", "content", "landing", "index.yaml"));
  return cwd;
}

describe("runList", () => {
  it("returns the project document", () => {
    const { doc } = runList({ cwd: project() });
    expect(doc.sections.map((s) => s.id)).toEqual(["hero-1", "features-1"]);
  });

  it("throws the generate-first error when there is no project", () => {
    expect(() => runList({ cwd: tmp() })).toThrow(/pagelathe generate/);
  });
});
