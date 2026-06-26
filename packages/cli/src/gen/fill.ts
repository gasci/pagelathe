import { z } from "zod";
import { getSection } from "@pagelathe/sections";
import type { Archetype, SectionType } from "@pagelathe/sections/manifest";
import type { LlmClient } from "./llm.js";
import { fillSystem, metaSystem } from "./prompts.js";

export async function fillSection(
  input: { type: SectionType; description: string; archetype: Archetype; brand: string },
  llm: LlmClient,
): Promise<unknown> {
  const section = getSection(input.type);
  if (!section) throw new Error(`Unknown section: ${input.type}`);
  return llm.generateObject(section.propsSchema, {
    system: fillSystem(input.type, input.archetype),
    schemaName: `${input.type}_props`,
    prompt: `Product "${input.brand}": ${input.description}

Write the props for the "${input.type}" section. Use real, specific copy consistent with the product. Reuse the brand name "${input.brand}" where a brand is needed.`,
  });
}

const metaResultSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  primaryGoal: z.enum(["signup", "github_star", "docs", "contact", "waitlist", "purchase"]),
  brand: z.string().min(1),
});

export async function deriveMeta(
  input: { description: string },
  llm: LlmClient,
): Promise<z.infer<typeof metaResultSchema>> {
  return llm.generateObject(metaResultSchema, {
    system: metaSystem,
    schemaName: "page_meta",
    prompt: `From this product description, produce: a short brand name, an SEO title ("<Brand> — <value>"), a one-sentence meta description, and the primary conversion goal.

Description:
${input.description}`,
  });
}
