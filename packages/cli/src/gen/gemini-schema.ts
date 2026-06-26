/**
 * Translate a JSON Schema (draft-07, as emitted by zod-to-json-schema) into the
 * OpenAPI-3.0 subset Gemini accepts for `generationConfig.responseSchema`.
 *
 * Gemini rejects JSON-Schema-only keywords (`$schema`, `additionalProperties`,
 * `$ref`, `const`, `default`, …), so we keep a whitelist and recurse into nested
 * schemas. Nullability expressed as `type: [..., "null"]` or an `anyOf` null
 * branch is folded into Gemini's `nullable: true`.
 */
const SUPPORTED_KEYS = new Set([
  "type",
  "format",
  "description",
  "nullable",
  "enum",
  "minItems",
  "maxItems",
  "properties",
  "required",
  "items",
  "anyOf",
  "propertyOrdering",
]);

export function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node === null || typeof node !== "object") return node;
  const obj = node as Record<string, unknown>;

  let nullable = false;

  // Normalize `type: ["string", "null"]` → type "string" + nullable.
  let typeValue = obj.type;
  if (Array.isArray(typeValue)) {
    const nonNull = typeValue.filter((t) => t !== "null");
    if (nonNull.length !== typeValue.length) nullable = true;
    typeValue = nonNull.length === 1 ? nonNull[0] : nonNull;
  }

  const out: Record<string, unknown> = {};
  if (typeValue !== undefined) out.type = typeValue;

  for (const [key, value] of Object.entries(obj)) {
    if (key === "type" || !SUPPORTED_KEYS.has(key)) continue;
    if (key === "properties" && value && typeof value === "object") {
      const props: Record<string, unknown> = {};
      for (const [propName, propSchema] of Object.entries(value as Record<string, unknown>)) {
        props[propName] = toGeminiSchema(propSchema);
      }
      out.properties = props;
    } else if (key === "items") {
      out.items = toGeminiSchema(value);
    } else if (key === "anyOf" && Array.isArray(value)) {
      const branches = value.filter(
        (b) => !(b && typeof b === "object" && (b as Record<string, unknown>).type === "null"),
      );
      if (branches.length !== value.length) nullable = true;
      out.anyOf = branches.map(toGeminiSchema);
    } else {
      out[key] = value;
    }
  }

  if (nullable) out.nullable = true;
  return out;
}
