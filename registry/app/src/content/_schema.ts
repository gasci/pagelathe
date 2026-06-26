import { z } from "zod";

/**
 * Envelope schema for the landing document. The pagelathe CLI validates every
 * section's props against its strict per-section schema at generation time;
 * this app-side schema validates document STRUCTURE so the project builds with
 * only public dependencies (no private @pagelathe/* package required).
 */
export const pageDocumentSchema = z.object({
  meta: z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    locales: z.array(z.string()).min(1).default(["en"]),
    primaryGoal: z.string().default("signup"),
  }),
  theme: z.object({ tokens: z.record(z.string()).default({}) }).default({ tokens: {} }),
  archetype: z.string().default("general"),
  sections: z
    .array(
      z.object({
        type: z.string().min(1),
        id: z.string().min(1),
        props: z.record(z.unknown()),
      }),
    )
    .min(1),
});
