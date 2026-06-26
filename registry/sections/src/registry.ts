import { buildPageDocumentSchema } from "./page.js";
import type { RegistryEntry, SectionType } from "./manifest.js";
import * as hero from "../hero/schema.js";
import * as header from "../header/schema.js";
import * as footer from "../footer/schema.js";
import * as features from "../features/schema.js";
import * as codeDemo from "../codeDemo/schema.js";
import * as pricing from "../pricing/schema.js";
import * as finalCta from "../finalCta/schema.js";

/**
 * Each section module (registry/sections/<type>/schema.ts) exports
 * `propsSchema`, `manifest`, and `entrySchema`. Section tasks append their
 * module to this list — this is the single enumeration point (shadcn-style).
 */
export const sectionModules: RegistryEntry[] = [
  { manifest: hero.manifest, propsSchema: hero.propsSchema, entrySchema: hero.entrySchema },
  { manifest: header.manifest, propsSchema: header.propsSchema, entrySchema: header.entrySchema },
  { manifest: footer.manifest, propsSchema: footer.propsSchema, entrySchema: footer.entrySchema },
  {
    manifest: features.manifest,
    propsSchema: features.propsSchema,
    entrySchema: features.entrySchema,
  },
  {
    manifest: codeDemo.manifest,
    propsSchema: codeDemo.propsSchema,
    entrySchema: codeDemo.entrySchema,
  },
  {
    manifest: pricing.manifest,
    propsSchema: pricing.propsSchema,
    entrySchema: pricing.entrySchema,
  },
  {
    manifest: finalCta.manifest,
    propsSchema: finalCta.propsSchema,
    entrySchema: finalCta.entrySchema,
  },
];

export const registry: Partial<Record<SectionType, RegistryEntry>> = Object.fromEntries(
  sectionModules.map((m) => [m.manifest.type, m]),
) as Partial<Record<SectionType, RegistryEntry>>;

export function listSections(): RegistryEntry[] {
  return [...sectionModules];
}

export function getSection(type: string): RegistryEntry | undefined {
  return registry[type as SectionType];
}

const entrySchemas = sectionModules.map((m) => m.entrySchema);

/** Full page-document schema, assembled from every registered section's entry
 *  schema (the discriminated union over section `type`). */
export const pageDocumentSchema = buildPageDocumentSchema(
  entrySchemas as [(typeof entrySchemas)[number], ...typeof entrySchemas],
);

export type PageDocument = import("zod").infer<typeof pageDocumentSchema>;
