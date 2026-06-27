type Path = (string | number)[];

/** Split a dotted path; integer segments become array indices. */
export function parsePath(raw: string): Path {
  return raw.split(".").map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

/** Read the value at `path`, or `undefined` if any segment is absent. */
export function getAtPath(value: unknown, path: Path): unknown {
  let cur: unknown = value;
  for (const seg of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  return cur;
}

/** Dotted paths to every scalar leaf in `value` (objects and arrays). */
export function listLeafPaths(value: unknown, prefix: Path = []): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => listLeafPaths(v, [...prefix, i]));
  if (value != null && typeof value === "object")
    return Object.entries(value).flatMap(([k, v]) => listLeafPaths(v, [...prefix, k]));
  return [prefix.join(".")];
}

export interface LeafChange {
  path: string;
  from: unknown;
  to: unknown;
}

/** Scalar leaves whose value differs between `before` and `after`. */
export function diffLeaves(before: unknown, after: unknown): LeafChange[] {
  const paths: string[] = [];
  for (const p of [...listLeafPaths(before), ...listLeafPaths(after)]) {
    if (!paths.includes(p)) paths.push(p);
  }
  const changes: LeafChange[] = [];
  for (const p of paths) {
    const segs = parsePath(p);
    const from = getAtPath(before, segs);
    const to = getAtPath(after, segs);
    if (from !== to) changes.push({ path: p, from, to });
  }
  return changes;
}
