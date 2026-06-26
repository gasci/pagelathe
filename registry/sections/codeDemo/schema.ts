import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

export const snippetSchema = z.object({
  lang: z.string().min(1),
  label: z.string().min(1),
  source: z.string().min(1),
});

export const propsSchema = z.object({
  heading: z.string().min(1),
  subhead: z.string().optional(),
  snippets: z.array(snippetSchema).min(1).max(6),
});

export const entrySchema = z.object({
  type: z.literal("codeDemo"),
  id: z.string().min(1),
  props: propsSchema,
});

export const manifest: SectionManifest = {
  type: "codeDemo",
  title: "Code / Integration demo",
  description: "Multi-language code tabs with shiki highlighting and copy-to-clipboard.",
  required: true,
  archetypes: ["sdk-infra", "technical-app"],
  componentFile: "section.astro",
  defaultProps: {
    heading: "Drop it into your stack",
    subhead: "Same API across languages.",
    snippets: [
      {
        lang: "python",
        label: "Python",
        source: 'from branchy import Client\nc = Client()\nc.create("feat-x")',
      },
      {
        lang: "javascript",
        label: "Node",
        source: "import { Client } from 'branchy'\nawait new Client().create('feat-x')",
      },
      { lang: "go", label: "Go", source: 'client := branchy.New()\nclient.Create("feat-x")' },
    ],
  } satisfies z.input<typeof propsSchema>,
};
