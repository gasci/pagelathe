import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const navLinkSchema = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const propsSchema = z.object({
  brand: z.string().min(1),
  links: z.array(navLinkSchema).max(6).default([]),
  github: z.object({ href: z.string().min(1), stars: z.string().optional() }).optional(),
  cta: z.object({ label: z.string().min(1), href: z.string().min(1) }).optional(),
});

export const entrySchema = z.object({
  type: z.literal("header"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "header",
  title: "Header / Navbar",
  description: "Top navigation with brand, links, GitHub star badge, and a co-equal docs/CTA link.",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    brand: "Branchy",
    links: [
      { label: "Docs", href: "/docs" },
      { label: "Pricing", href: "#pricing" },
    ],
    github: { href: "https://github.com", stars: "4.2k" },
    cta: { label: "Start free", href: "#get-started" },
  } satisfies z.input<typeof propsSchema>,
};
