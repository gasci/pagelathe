import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const tierSchema = z.object({
  name: z.string().min(1),
  price: z.string().min(1),
  period: z.string().optional(),
  description: z.string().min(1),
  features: z.array(z.string().min(1)).min(1),
  cta: z.object({ label: z.string().min(1), href: z.string().min(1) }),
  featured: z.boolean().default(false),
});

export const propsSchema = z.object({
  heading: z.string().min(1),
  subhead: z.string().optional(),
  tiers: z.array(tierSchema).min(1).max(4),
});

export const entrySchema = z.object({
  type: z.literal("pricing"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "pricing",
  title: "Pricing",
  description: "Transparent pricing tiers with honest constraints (rate limits, free tier).",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    heading: "Honest pricing",
    subhead: "Start free. No credit card.",
    tiers: [
      {
        name: "Open source",
        price: "$0",
        description: "Self-host, unlimited branches.",
        features: ["Self-hosted", "Community support", "Apache-2.0"],
        cta: { label: "Get started", href: "#get-started" },
      },
      {
        name: "Team",
        price: "$29",
        period: "/mo",
        description: "Managed cloud for small teams.",
        features: ["10 projects", "Daily backups", "Email support"],
        cta: { label: "Start trial", href: "#trial" },
        featured: true,
      },
    ],
  } satisfies z.input<typeof propsSchema>,
};
