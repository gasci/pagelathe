import type { ZodTypeAny } from "zod";

export type Archetype = "sdk-infra" | "technical-app" | "general";

export type PrimaryGoal = "signup" | "github_star" | "docs" | "contact" | "waitlist" | "purchase";

/** Canonical M2 section types. Extending the registry adds to this union. */
export type SectionType =
  | "header"
  | "hero"
  | "features"
  | "codeDemo"
  | "pricing"
  | "finalCta"
  | "footer";

export interface SectionManifest {
  /** Stable id; equals the section directory name. */
  type: SectionType;
  /** Human title for docs/registry listings. */
  title: string;
  /** One-line description of the section's purpose. */
  description: string;
  /** Required-by-default in a generated page. */
  required: boolean;
  /** Archetypes that include this section by default. */
  archetypes: Archetype[];
  /** Optional named variants (e.g. hero: code-snippet | product-ui). */
  variants?: string[];
  /** Component file name within the section directory. Always "section.astro". */
  componentFile: string;
  /** Default props — MUST validate against the section's propsSchema. Used by
   *  the init starter document and (M3) as a structured-output seed/example. */
  defaultProps: unknown;
}

export interface RegistryEntry {
  manifest: SectionManifest;
  propsSchema: ZodTypeAny;
  entrySchema: ZodTypeAny;
}
