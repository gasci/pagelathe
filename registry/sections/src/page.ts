import { z, type ZodTypeAny } from "zod";

export const primaryGoalSchema = z.enum([
  "signup",
  "github_star",
  "docs",
  "contact",
  "waitlist",
  "purchase",
]);

export const archetypeSchema = z.enum(["sdk-infra", "technical-app", "general"]);

export const metaSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  locales: z.array(z.string().min(2)).min(1).default(["en"]),
  primaryGoal: primaryGoalSchema.default("signup"),
});

export const themeSchema = z.object({
  tokens: z
    .object({
      colorPrimary: z.string().min(1).default("#3A6463"),
      radius: z.string().min(1).default("0.5rem"),
      font: z.string().min(1).default("Inter"),
    })
    .default({}),
});

/**
 * Assemble the full page-document schema from the per-section entry schemas.
 * `entrySchemas` is the list of each section's `{ type, id, props }` object
 * schema; their literal `type` discriminators form the section union.
 */
export function buildPageDocumentSchema(entrySchemas: [ZodTypeAny, ...ZodTypeAny[]]) {
  const sectionUnion =
    entrySchemas.length === 1
      ? entrySchemas[0]
      : // eslint-disable-next-line @typescript-eslint/no-explicit-any
        z.discriminatedUnion("type", entrySchemas as any);
  return z.object({
    meta: metaSchema,
    theme: themeSchema.default({ tokens: {} }),
    archetype: archetypeSchema.default("general"),
    sections: z.array(sectionUnion).min(1),
  });
}
