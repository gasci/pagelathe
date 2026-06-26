import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const propsSchema = z.object({
  headline: z.string().min(1),
  subhead: z.string().optional(),
  cta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
  microcopy: z.string().optional(),
});

export const entrySchema = z.object({
  type: z.literal("finalCta"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "finalCta",
  title: "Final CTA",
  description: "Closing call to action with action-specific label and honest microcopy.",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    headline: "Ship your first branch today",
    subhead: "Free and open source. Self-host in minutes.",
    cta: { label: "Start free", href: "#get-started" },
    microcopy: "No credit card · Apache-2.0",
  } satisfies z.input<typeof propsSchema>,
};
