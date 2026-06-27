import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml, readDocumentYaml } from "../src/gen/yaml-doc.js";
import { runEdit } from "../src/commands/edit-cmd.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-edit-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function project(): string {
  const cwd = tmp();
  const doc = {
    meta: { title: "B — x", description: "d", locales: ["en"], primaryGoal: "signup" },
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

describe("runEdit", () => {
  it("sets a scalar and a nested array field, leaving other sections intact", async () => {
    const cwd = project();
    const yamlFile = join(cwd, "src/content/landing/index.yaml");
    const featuresBefore = readDocumentYaml(yamlFile).sections.find((s) => s.id === "features-1")!
      .props;
    const res = await runEdit({
      cwd,
      sectionId: "hero-1",
      sets: [
        { path: "headline", value: "Branch your DB" },
        { path: "ctas.0.label", value: "Get started" },
        { path: "variant", value: "product-ui" },
      ],
    });
    expect(res.written).toBe(true);
    const doc = readDocumentYaml(yamlFile);
    const hero = doc.sections.find((s) => s.id === "hero-1")!;
    expect((hero.props as { headline: string }).headline).toBe("Branch your DB");
    expect((hero.props as { ctas: { label: string }[] }).ctas[0].label).toBe("Get started");
    expect((hero.props as { variant: string }).variant).toBe("product-ui");
    // other section untouched by the edit (compare against its pre-edit value)
    const features = doc.sections.find((s) => s.id === "features-1")!;
    expect(features.props).toEqual(featuresBefore);
  });

  it("coerces a boolean via the schema", async () => {
    const cwd = project();
    await runEdit({
      cwd,
      sectionId: "features-1",
      sets: [{ path: "items.1.emphasis", value: "true" }],
    });
    const doc = readDocumentYaml(join(cwd, "src/content/landing/index.yaml"));
    const features = doc.sections.find((s) => s.id === "features-1")!;
    expect((features.props as { items: { emphasis: boolean }[] }).items[1].emphasis).toBe(true);
  });

  it("rejects an invalid value and writes nothing (last-good preserved)", async () => {
    const cwd = project();
    const before = readDocumentYaml(join(cwd, "src/content/landing/index.yaml"));
    await expect(
      runEdit({ cwd, sectionId: "hero-1", sets: [{ path: "headline", value: "" }] }),
    ).rejects.toThrow();
    const after = readDocumentYaml(join(cwd, "src/content/landing/index.yaml"));
    expect(after).toEqual(before);
  });

  it("errors on an unknown section id and lists available ids", async () => {
    const cwd = project();
    await expect(runEdit({ cwd, sectionId: "nope-9", sets: [] })).rejects.toThrow(
      /hero-1, features-1/,
    );
  });

  it("inspect mode (no sets) returns props + editable paths without writing", async () => {
    const cwd = project();
    const res = await runEdit({ cwd, sectionId: "hero-1" });
    expect(res.written).toBe(false);
    expect(res.editablePaths).toContain("headline");
    expect(res.editablePaths).toContain("ctas.0.label");
  });
});
