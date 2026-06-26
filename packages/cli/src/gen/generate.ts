import { join } from "node:path";
import { pageDocumentSchema } from "@pagelathe/sections";
import type { PageDocument } from "@pagelathe/sections";
import type { SectionType } from "@pagelathe/sections/manifest";
import { sectionComponentPath } from "../registry/read.js";
import { copyInto } from "../fs/scaffold.js";
import type { LlmClient } from "./llm.js";
import { classifyArchetype } from "./archetype.js";
import { planSections } from "./planner.js";
import { fillSection, deriveMeta } from "./fill.js";
import { writeDocumentYaml } from "./yaml-doc.js";

export interface GenerateInput {
  description: string;
  cwd: string;
  llm: LlmClient;
  onProgress?: (msg: string) => void;
}

export interface GenerateResult {
  document: PageDocument;
  vendored: SectionType[];
  yamlPath: string;
}

export async function generate(input: GenerateInput): Promise<GenerateResult> {
  const log = input.onProgress ?? (() => {});
  log("Classifying product…");
  const archetype = await classifyArchetype(input.description, input.llm);
  log(`Archetype: ${archetype}`);

  const meta = await deriveMeta({ description: input.description }, input.llm);
  log(`Planning sections…`);
  const types = await planSections({ description: input.description, archetype }, input.llm);

  const sections = [];
  for (const type of types) {
    log(`Writing ${type}…`);
    const props = await fillSection(
      { type, description: input.description, archetype, brand: meta.brand },
      input.llm,
    );
    sections.push({ type, id: `${type}-1`, props });
  }

  // pageDocumentSchema.parse is the final keystone gate — throws BEFORE any
  // file write if the assembled document is invalid, preserving last-good.
  const document = pageDocumentSchema.parse({
    meta: {
      title: meta.title,
      description: meta.description,
      locales: ["en"],
      primaryGoal: meta.primaryGoal,
    },
    theme: { tokens: {} },
    archetype,
    sections,
  }) as PageDocument;

  // Vendor the chosen section components, then write the document atomically.
  for (const type of types) {
    copyInto(
      sectionComponentPath(type),
      join(input.cwd, "src", "components", "sections", `${type}.astro`),
    );
  }
  const yamlPath = join(input.cwd, "src", "content", "landing", "index.yaml");
  writeDocumentYaml(document, yamlPath);

  return { document, vendored: types, yamlPath };
}
