import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ZodType } from "zod";
import { getSection } from "@pagelathe/sections";
import { writeDocumentYaml, readDocumentYaml } from "../src/gen/yaml-doc.js";
import { runEdit } from "../src/commands/edit-cmd.js";
import { LlmError, type LlmClient } from "../src/gen/llm.js";

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
    meta: {
      title: "Branchy — branching",
      description: "d",
      locales: ["en"],
      primaryGoal: "signup",
    },
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

/** Fake LLM that returns the hero props with one changed headline. */
function fakeHero(headline = "Branch your DB per PR"): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>) => {
      const current = getSection("hero")!.manifest.defaultProps as object;
      return Promise.resolve(schema.parse({ ...current, headline }));
    },
  };
}

describe("runEdit", () => {
  it("revises a section from a prompt, reports the diff, leaves others intact", async () => {
    const cwd = project();
    const yamlFile = join(cwd, "src/content/landing/index.yaml");
    const featuresBefore = readDocumentYaml(yamlFile).sections.find(
      (s) => s.id === "features-1",
    )!.props;

    const res = await runEdit({
      cwd,
      sectionId: "hero-1",
      instruction: "make the headline punchier",
      llm: fakeHero("Branch your DB per PR"),
    });

    expect(res.changes).toContainEqual({
      path: "headline",
      from: (getSection("hero")!.manifest.defaultProps as { headline: string }).headline,
      to: "Branch your DB per PR",
    });
    expect(res.usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });

    const doc = readDocumentYaml(yamlFile);
    expect(
      (doc.sections.find((s) => s.id === "hero-1")!.props as { headline: string }).headline,
    ).toBe("Branch your DB per PR");
    expect(doc.sections.find((s) => s.id === "features-1")!.props).toEqual(featuresBefore);
  });

  it("requires a non-empty instruction", async () => {
    await expect(
      runEdit({ cwd: project(), sectionId: "hero-1", instruction: "   ", llm: fakeHero() }),
    ).rejects.toThrow(/instruction/i);
  });

  it("errors on an unknown section id and lists available ids", async () => {
    await expect(
      runEdit({ cwd: project(), sectionId: "nope-9", instruction: "x", llm: fakeHero() }),
    ).rejects.toThrow(/hero-1, features-1/);
  });

  it("returns token usage (zero for an injected llm)", async () => {
    const res = await runEdit({
      cwd: project(),
      sectionId: "hero-1",
      instruction: "tweak",
      llm: fakeHero(),
    });
    expect(res.usage).toEqual({ promptTokens: 0, completionTokens: 0, totalTokens: 0 });
    expect(res.sectionId).toBe("hero-1");
  });

  it("propagates an LLM failure and leaves index.yaml untouched (last-good)", async () => {
    const cwd = project();
    const yamlFile = join(cwd, "src/content/landing/index.yaml");
    const before = readFileSync(yamlFile, "utf8");
    const failing: LlmClient = {
      generateObject: () => Promise.reject(new LlmError("429", { status: 429, attempts: 3 })),
    };
    await expect(
      runEdit({ cwd, sectionId: "hero-1", instruction: "make it punchier", llm: failing }),
    ).rejects.toBeInstanceOf(LlmError);
    expect(readFileSync(yamlFile, "utf8")).toBe(before); // nothing written
  });
});
