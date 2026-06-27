import { getSection } from "@pagelathe/sections";
import type { Archetype, SectionType } from "@pagelathe/sections/manifest";
import type { LlmClient } from "./llm.js";
import { editSystem } from "./prompts.js";

export interface EditSectionInput {
  type: SectionType | string;
  currentProps: unknown;
  instruction: string;
  archetype: Archetype | string;
  /** Product name/title, for brand context in the prompt. */
  product: string;
}

/** Re-fill one section's props from an edit instruction, bounded by its schema. */
export async function editSection(input: EditSectionInput, llm: LlmClient): Promise<unknown> {
  const section = getSection(input.type);
  if (!section) throw new Error(`Unknown section: ${input.type}`);
  return llm.generateObject(section.propsSchema, {
    system: editSystem(String(input.type), String(input.archetype)),
    schemaName: `${input.type}_props`,
    prompt: `Product "${input.product}". Current props for the "${input.type}" section (JSON):
${JSON.stringify(input.currentProps, null, 2)}

Apply ONLY this change and keep every other field exactly as given:
${input.instruction}

Return the COMPLETE props object for the section with the change applied.`,
  });
}
