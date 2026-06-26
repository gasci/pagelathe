import { z } from "zod";
import { listSections } from "@pagelathe/sections";
import type { Archetype, SectionType } from "@pagelathe/sections/manifest";
import type { LlmClient } from "./llm.js";
import { plannerSystem } from "./prompts.js";

/** Canonical render order; the planner output is reordered to match this. */
const CANONICAL_ORDER: SectionType[] = [
  "header",
  "hero",
  "features",
  "codeDemo",
  "pricing",
  "finalCta",
  "footer",
];

const REQUIRED: SectionType[] = ["header", "hero", "features", "pricing", "finalCta", "footer"];

export async function planSections(
  input: { description: string; archetype: Archetype },
  llm: LlmClient,
): Promise<SectionType[]> {
  const available = listSections().map((s) => s.manifest.type) as [SectionType, ...SectionType[]];
  const schema = z.object({
    sections: z.array(z.enum(available)).min(1),
  });
  const { sections } = await llm.generateObject(schema, {
    system: plannerSystem,
    schemaName: "section_plan",
    prompt: `Choose which sections this ${input.archetype} product page should include, from: ${available.join(", ")}.
Always include: ${REQUIRED.join(", ")}.
For sdk-infra/technical-app, include codeDemo.
Return them in the order they should appear.

Product description:
${input.description}`,
  });

  // Enforce invariants regardless of model output:
  const chosen = new Set<SectionType>(sections);
  for (const r of REQUIRED) chosen.add(r);
  if (input.archetype !== "general") chosen.add("codeDemo");
  // Reorder to canonical order; keep only known types.
  return CANONICAL_ORDER.filter((t) => chosen.has(t));
}
