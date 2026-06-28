/** A repeatable child collection within a section's props. */
export interface ChildSummary {
  prop: string;
  count: number;
  labels: string[];
}

const LABEL_KEYS = ["label", "title", "name", "heading", "text", "headline"] as const;

/** Best human label for one array item. */
function itemLabel(item: unknown, index: number): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const obj = item as Record<string, unknown>;
    for (const key of LABEL_KEYS) {
      const v = obj[key];
      if (typeof v === "string" && v.length > 0) return v;
    }
    for (const v of Object.values(obj)) {
      if (typeof v === "string" && v.length > 0) return v;
    }
  }
  return `item ${index + 1}`;
}

/**
 * Summarize a section's "children": every array-valued prop, with the first
 * three item labels and the total count. Schema-agnostic — new sections need
 * no changes here. Scalars and nested objects are ignored.
 */
export function summarizeChildren(props: unknown): ChildSummary[] {
  if (!props || typeof props !== "object") return [];
  const out: ChildSummary[] = [];
  for (const [prop, value] of Object.entries(props as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    out.push({ prop, count: value.length, labels: value.slice(0, 3).map(itemLabel) });
  }
  return out;
}
