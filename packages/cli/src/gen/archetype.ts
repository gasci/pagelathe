import { z } from "zod";
import type { Archetype } from "@pagelathe/sections/manifest";
import type { LlmClient } from "./llm.js";
import { archetypeSystem } from "./prompts.js";

const resultSchema = z.object({
  archetype: z.enum(["sdk-infra", "technical-app", "general"]),
  reason: z.string().min(1),
});

export async function classifyArchetype(description: string, llm: LlmClient): Promise<Archetype> {
  const { archetype } = await llm.generateObject(resultSchema, {
    system: archetypeSystem,
    schemaName: "archetype",
    prompt: `Classify this product into one archetype.
- sdk-infra: SDKs, APIs, databases, infra, CLIs, libraries (code-forward).
- technical-app: technical SaaS / apps with a UI for technical users.
- general: anything else technical.

Product description:
${description}`,
  });
  return archetype;
}
