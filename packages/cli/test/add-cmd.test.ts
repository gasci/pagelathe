import { afterEach, describe, expect, it } from "vitest";
import { existsSync, mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml, readDocumentYaml } from "../src/gen/yaml-doc.js";
import { runAdd } from "../src/commands/add-cmd.js";

const tmps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), "pl-add-"));
  tmps.push(d);
  return d;
};
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

function project(ids = ["hero-1"]): string {
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

describe("runAdd", () => {
  it("vendors the component and appends an entry with default props + fresh id", async () => {
    const cwd = project();
    const res = await runAdd("pricing", { cwd });
    expect(res.id).toBe("pricing-1");
    expect(res.vendored).toBe(true);
    expect(existsSync(res.componentPath)).toBe(true);
    const doc = readDocumentYaml(join(cwd, "src", "content", "landing", "index.yaml"));
    expect(doc.sections.map((s) => s.id)).toEqual(["hero-1", "pricing-1"]);
    expect(doc.sections[1].props).toEqual(
      getSection("pricing")!.propsSchema.parse(getSection("pricing")!.manifest.defaultProps),
    );
  });

  it("increments the id when the type already exists", async () => {
    const res = await runAdd("hero", { cwd: project(["hero-1"]) });
    expect(res.id).toBe("hero-2");
  });

  it("places --before and --after a target id", async () => {
    const before = await runAdd("pricing", { cwd: project(["hero-1", "footer-1"]), before: "footer-1" });
    const doc = readDocumentYaml(join(before.yamlPath));
    expect(doc.sections.map((s) => s.id)).toEqual(["hero-1", "pricing-1", "footer-1"]);
    expect(before.position).toBe(2);
  });

  it("places --after a target id", async () => {
    const after = await runAdd("pricing", { cwd: project(["hero-1", "footer-1"]), after: "hero-1" });
    const doc = readDocumentYaml(after.yamlPath);
    expect(doc.sections.map((s) => s.id)).toEqual(["hero-1", "pricing-1", "footer-1"]);
    expect(after.position).toBe(2);
  });

  it("skips re-vendoring when the component exists, but --force re-copies", async () => {
    const cwd = project();
    await runAdd("pricing", { cwd }); // vendors pricing.astro
    const second = await runAdd("pricing", { cwd });
    expect(second.vendored).toBe(false);
    expect(second.id).toBe("pricing-2");
    const path = second.componentPath;
    writeFileSync(path, "// hand-edited");
    const third = await runAdd("pricing", { cwd, force: true });
    expect(third.vendored).toBe(true);
    expect(readFileSync(path, "utf8")).not.toContain("hand-edited");
  });

  it("rejects an unknown section type with the available list", async () => {
    await expect(runAdd("nope", { cwd: project() })).rejects.toThrow(
      /Unknown section: "nope"\. Available sections: /,
    );
  });

  it("requires a project (index.yaml)", async () => {
    await expect(runAdd("pricing", { cwd: tmp() })).rejects.toThrow(/pagelathe generate/);
  });
});
