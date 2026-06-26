import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  style: z.enum(["primary", "secondary", "ghost"]).default("primary"),
});

export const propsSchema = z.object({
  variant: z.enum(["code-snippet", "product-ui"]).default("code-snippet"),
  eyebrow: z.string().optional(),
  headline: z.string().min(1),
  subhead: z.string().min(1),
  ctas: z.array(ctaSchema).min(1).max(3),
  /** Shown when variant === "code-snippet". */
  code: z.object({ lang: z.string().min(1), source: z.string().min(1) }).optional(),
  /** Shown when variant === "product-ui". */
  image: z.object({ src: z.string().min(1), alt: z.string().min(1) }).optional(),
});

export const entrySchema = z.object({
  type: z.literal("hero"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "hero",
  title: "Hero",
  description: "Above-the-fold value statement with CTAs; adaptive code or product-UI variant.",
  required: true,
  archetypes: ["sdk-infra", "technical-app", "general"],
  variants: ["code-snippet", "product-ui"],
  componentFile: "section.astro",
  defaultProps: {
    variant: "code-snippet",
    eyebrow: "Open source",
    headline: "Postgres branching for teams",
    subhead: "Spin up an isolated database branch per pull request in one command.",
    ctas: [
      { label: "Start free", href: "#get-started", style: "primary" },
      { label: "View on GitHub", href: "https://github.com", style: "secondary" },
    ],
    code: {
      lang: "bash",
      source: "npx branchy create --from main\n# → branch ready in 1.2s",
    },
  } satisfies z.input<typeof propsSchema>,
};
