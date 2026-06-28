import type { PageDocument } from "@pagelathe/sections";
import { summarizeChildren, type ChildSummary } from "./section-children.js";
import type { Section } from "./section-ops.js";

export interface SectionSummary {
  index: number;
  id: string;
  type: string;
  variant: string | null;
  children: ChildSummary[];
}

function variantOf(props: unknown): string | null {
  if (props && typeof props === "object") {
    const v = (props as Record<string, unknown>).variant;
    if (typeof v === "string" && v.length > 0) return v;
  }
  return null;
}

/** Structured per-section summary for `list` (drives both human + --json). */
export function summarizeSections(doc: PageDocument): SectionSummary[] {
  return doc.sections.map((s, i) => ({
    index: i + 1,
    id: s.id,
    type: s.type,
    variant: variantOf(s.props),
    children: summarizeChildren(s.props),
  }));
}

/** Compact map of sections + child summaries. */
export function renderList(doc: PageDocument): string {
  const summary = summarizeSections(doc);
  const idW = Math.max(0, ...summary.map((s) => s.id.length));
  const typeW = Math.max(0, ...summary.map((s) => s.type.length));
  const lines: string[] = [`${doc.meta.title} · ${doc.archetype} · goal: ${doc.meta.primaryGoal}`, ""];
  for (const s of summary) {
    const variant = s.variant ? `  [variant: ${s.variant}]` : "";
    lines.push(`${s.index}. ${s.id.padEnd(idW)}  ${s.type.padEnd(typeW)}${variant}`.trimEnd());
    for (const c of s.children) lines.push(`     · ${c.prop}: ${c.labels.join(", ")} (${c.count})`);
  }
  lines.push("", `${summary.length} section${summary.length === 1 ? "" : "s"}`);
  return lines.join("\n");
}

function isScalar(v: unknown): boolean {
  return v === null || ["string", "number", "boolean"].includes(typeof v);
}

function scalarText(v: unknown): string {
  return typeof v === "string" ? v : String(v);
}

/** One-line rendering of an object item as `key: value` pairs of its scalars. */
function renderInline(item: unknown): string {
  if (isScalar(item)) return scalarText(item);
  if (Array.isArray(item)) return item.map((el) => (isScalar(el) ? scalarText(el) : renderInline(el))).join(", ");
  return Object.entries(item as Record<string, unknown>)
    .filter(([, v]) => isScalar(v))
    .map(([k, v]) => `${k}: ${scalarText(v)}`)
    .join("  ·  ");
}

/** Recursively render a props value as aligned, readable text. */
export function renderProps(value: unknown, indent = ""): string {
  const lines: string[] = [];
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    const keyW = Math.max(0, ...entries.filter(([, v]) => isScalar(v)).map(([k]) => k.length));
    for (const [k, v] of entries) {
      if (isScalar(v)) lines.push(`${indent}${k.padEnd(keyW)}  ${scalarText(v)}`);
      else if (Array.isArray(v)) {
        lines.push(`${indent}${k}`);
        for (const item of v) lines.push(`${indent}  • ${renderInline(item)}`);
      } else {
        lines.push(`${indent}${k}`);
        lines.push(renderProps(v, `${indent}  `));
      }
    }
  } else if (Array.isArray(value)) {
    for (const item of value) lines.push(`${indent}• ${renderInline(item)}`);
  } else {
    lines.push(`${indent}${scalarText(value)}`);
  }
  return lines.join("\n");
}

/** Pretty-print one section: header rule + props. */
export function renderSection(entry: Section): string {
  const variant = variantOf(entry.props);
  const head = variant
    ? `${entry.id}  (${entry.type}, variant: ${variant})`
    : `${entry.id}  (${entry.type})`;
  return `${head}\n${"─".repeat(head.length)}\n${renderProps(entry.props)}`;
}

/** Pretty-print the whole page: meta block + every section. */
export function renderPage(doc: PageDocument): string {
  const meta = [
    doc.meta.title,
    doc.meta.description,
    `locales: ${doc.meta.locales.join(", ")} · goal: ${doc.meta.primaryGoal} · archetype: ${doc.archetype}`,
  ].join("\n");
  return [meta, ...doc.sections.map(renderSection)].join("\n\n");
}

/** Compact machine-readable summary for `list --json`. */
export function listToJson(doc: PageDocument) {
  return {
    meta: { title: doc.meta.title, primaryGoal: doc.meta.primaryGoal },
    archetype: doc.archetype,
    sections: summarizeSections(doc),
  };
}
