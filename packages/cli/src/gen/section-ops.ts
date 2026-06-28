import type { PageDocument } from "@pagelathe/sections";

export type Section = PageDocument["sections"][number];

/** Find a section by id, or undefined. */
export function findSection(doc: PageDocument, id: string): Section | undefined {
  return doc.sections.find((s) => s.id === id);
}

/** Smallest unused `<type>-<n>` (n ≥ 1) id for `type` in `doc`. */
export function nextSectionId(doc: PageDocument, type: string): string {
  const used = new Set(doc.sections.map((s) => s.id));
  let n = 1;
  while (used.has(`${type}-${n}`)) n += 1;
  return `${type}-${n}`;
}

export interface AddSectionResult {
  doc: PageDocument;
  /** 1-based index of the inserted section. */
  position: number;
  total: number;
}

/**
 * Return a NEW document with `entry` inserted. Default position is the end;
 * `before`/`after` place it relative to an existing section id. Throws if both
 * `before` and `after` are given, or the anchor id is absent.
 */
export function addSection(
  doc: PageDocument,
  entry: Section,
  opts: { before?: string; after?: string } = {},
): AddSectionResult {
  if (opts.before && opts.after) throw new Error("Pass only one of --before / --after.");
  const sections = [...doc.sections];
  let at = sections.length;
  const anchor = opts.before ?? opts.after;
  if (anchor) {
    const idx = sections.findIndex((s) => s.id === anchor);
    if (idx === -1) {
      const ids = sections.map((s) => s.id).join(", ") || "(none)";
      throw new Error(`No section with id "${anchor}". Available ids: ${ids}`);
    }
    at = opts.before ? idx : idx + 1;
  }
  sections.splice(at, 0, entry);
  return { doc: { ...doc, sections }, position: at + 1, total: sections.length };
}

export interface RemoveSectionResult {
  doc: PageDocument;
  removed: Section;
  /** True if another section still uses the removed section's type. */
  typeStillUsed: boolean;
}

/**
 * Return a NEW document with section `id` removed. Throws if the id is absent or
 * if it is the only remaining section (a page needs at least one).
 */
export function removeSection(doc: PageDocument, id: string): RemoveSectionResult {
  const idx = doc.sections.findIndex((s) => s.id === id);
  if (idx === -1) {
    const ids = doc.sections.map((s) => s.id).join(", ") || "(none)";
    throw new Error(`No section with id "${id}". Available ids: ${ids}`);
  }
  if (doc.sections.length === 1) {
    throw new Error("Cannot remove the last section; a page needs at least one.");
  }
  const removed = doc.sections[idx];
  const sections = doc.sections.filter((_, i) => i !== idx);
  const typeStillUsed = sections.some((s) => s.type === removed.type);
  return { doc: { ...doc, sections }, removed, typeStillUsed };
}
