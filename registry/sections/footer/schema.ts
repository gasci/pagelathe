import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

// Footer text is kept short on purpose: long taglines/labels look unbalanced and
// wrap awkwardly, so each field is bounded to a tight max length.
export const footerColumnSchema = z.object({
  heading: z.string().min(1).max(24),
  links: z.array(z.object({ label: z.string().min(1).max(24), href: z.string().min(1) })).min(1),
});

export const propsSchema = z.object({
  brand: z.string().min(1).max(40),
  tagline: z.string().max(80).optional(),
  columns: z.array(footerColumnSchema).max(4).default([]),
  copyright: z.string().min(1).max(80),
});

export const entrySchema = z.object({
  type: z.literal("footer"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "footer",
  title: "Footer",
  description: "Site footer with link columns and copyright.",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    brand: "Branchy",
    tagline: "Database branching for teams.",
    columns: [
      {
        heading: "Product",
        links: [
          { label: "Docs", href: "/docs" },
          { label: "Pricing", href: "#pricing" },
        ],
      },
      { heading: "Community", links: [{ label: "GitHub", href: "https://github.com" }] },
    ],
    copyright: "© 2026 Branchy. Apache-2.0.",
  } satisfies z.input<typeof propsSchema>,
};
