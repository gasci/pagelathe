import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const featureSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  /** Larger tile = more important feature (first item is the lead). */
  emphasis: z.boolean().default(false),
  icon: z.string().optional(),
});

export const propsSchema = z.object({
  heading: z.string().min(1),
  subhead: z.string().optional(),
  items: z.array(featureSchema).min(2).max(8),
});

export const entrySchema = z.object({
  type: z.literal("features"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "features",
  title: "Features / Bento",
  description: "Feature grid; the emphasized tile is the most important capability.",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    heading: "Built for teams that ship",
    subhead: "Isolated environments, instant reset, zero config.",
    items: [
      {
        title: "Branch per PR",
        body: "Every pull request gets an isolated database.",
        emphasis: true,
      },
      { title: "1-second reset", body: "Roll back to a clean state instantly." },
      { title: "Self-host or cloud", body: "Run it your way; data stays yours." },
    ],
  } satisfies z.input<typeof propsSchema>,
};
