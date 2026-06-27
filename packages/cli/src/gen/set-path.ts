import type { ZodTypeAny } from "zod";

type Path = (string | number)[];

/** Split a dotted path; integer segments become array indices. */
export function parsePath(raw: string): Path {
  return raw.split(".").map((seg) => (/^\d+$/.test(seg) ? Number(seg) : seg));
}

/** Peel Zod wrappers (optional/default/nullable/effects/branded/readonly). */
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  let cur = schema as { _def?: Record<string, unknown> } | undefined;
  for (;;) {
    const tn = cur?._def?.typeName as string | undefined;
    if (tn === "ZodOptional" || tn === "ZodNullable" || tn === "ZodDefault" || tn === "ZodReadonly")
      cur = (cur as { _def: { innerType: ZodTypeAny } })._def.innerType;
    else if (tn === "ZodEffects") cur = (cur as { _def: { schema: ZodTypeAny } })._def.schema;
    else if (tn === "ZodBranded") cur = (cur as { _def: { type: ZodTypeAny } })._def.type;
    else break;
  }
  return cur as ZodTypeAny;
}

/** Walk the schema to the type at `path`; throws if the path isn't in the schema. */
export function resolveSchemaAt(schema: ZodTypeAny, path: Path): ZodTypeAny {
  let cur = schema;
  for (const seg of path) {
    cur = unwrap(cur);
    const tn = (cur as { _def: { typeName: string } })._def.typeName;
    if (typeof seg === "number") {
      if (tn !== "ZodArray") throw new Error(`Field "${seg}" is not an array index here.`);
      cur = (cur as { _def: { type: ZodTypeAny } })._def.type;
    } else {
      if (tn !== "ZodObject") throw new Error(`Unknown field "${seg}".`);
      const shape = (cur as { _def: { shape: () => Record<string, ZodTypeAny> } })._def.shape();
      if (!(seg in shape)) throw new Error(`Unknown field "${seg}".`);
      cur = shape[seg];
    }
  }
  return cur;
}

/** Coerce the raw CLI string using the declared Zod type at `path`. */
export function coerceValue(schema: ZodTypeAny, path: Path, raw: string): unknown {
  const leaf = unwrap(resolveSchemaAt(schema, path));
  const tn = (leaf as { _def: { typeName: string } })._def.typeName;
  const label = path.join(".");
  if (tn === "ZodBoolean") {
    if (raw === "true") return true;
    if (raw === "false") return false;
    throw new Error(`Expected true/false for "${label}", got "${raw}".`);
  }
  if (tn === "ZodNumber") {
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n))
      throw new Error(`Expected a number for "${label}", got "${raw}".`);
    return n;
  }
  if (tn === "ZodEnum") {
    const values = (leaf as { _def: { values: string[] } })._def.values;
    if (!values.includes(raw))
      throw new Error(`Expected one of ${values.join("|")} for "${label}", got "${raw}".`);
    return raw;
  }
  return raw;
}

/** Return a deep clone of `value` with the leaf at `path` overwritten. */
export function applySet<T>(value: T, path: Path, leaf: unknown): T {
  const clone = structuredClone(value) as Record<string | number, unknown>;
  let cur: unknown = clone;
  for (let i = 0; i < path.length - 1; i++) {
    const seg = path[i];
    if (typeof seg === "number") {
      if (!Array.isArray(cur) || seg < 0 || seg >= cur.length)
        throw new Error(`Index [${seg}] is out of range for "${path.slice(0, i + 1).join(".")}".`);
    } else if (cur == null || typeof cur !== "object" || !(seg in (cur as object))) {
      throw new Error(`Missing parent "${path.slice(0, i + 1).join(".")}".`);
    }
    cur = (cur as Record<string | number, unknown>)[seg];
  }
  const last = path[path.length - 1];
  if (typeof last === "number") {
    if (!Array.isArray(cur) || last < 0 || last >= cur.length)
      throw new Error(`Index [${last}] is out of range for "${path.join(".")}".`);
  } else if (cur == null || typeof cur !== "object") {
    throw new Error(`Cannot set "${path.join(".")}" — parent is not an object.`);
  }
  (cur as Record<string | number, unknown>)[last] = leaf;
  return clone as T;
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
