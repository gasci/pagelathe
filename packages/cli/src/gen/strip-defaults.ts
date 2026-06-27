import { z, type ZodTypeAny } from "zod";

/**
 * Return a copy of `schema` with every `.default(...)` removed, recursing through
 * objects and arrays. A defaulted field becomes **required**, so when a model
 * omits it during an edit, validation fails (triggering the re-prompt loop)
 * instead of Zod silently re-applying the default and wiping the user's value.
 * Genuinely optional (no-default) fields stay optional; array length constraints
 * (`min`/`max`/`length`) are preserved.
 */
export function stripSchemaDefaults(schema: ZodTypeAny): ZodTypeAny {
  const def = (schema as { _def: Record<string, unknown> })._def;
  const typeName = def.typeName as string;

  switch (typeName) {
    case "ZodDefault":
      // Drop the default wrapper entirely; recurse into the wrapped type.
      return stripSchemaDefaults(def.innerType as ZodTypeAny);
    case "ZodOptional":
      return stripSchemaDefaults(def.innerType as ZodTypeAny).optional();
    case "ZodNullable":
      return stripSchemaDefaults(def.innerType as ZodTypeAny).nullable();
    case "ZodEffects":
      return stripSchemaDefaults(def.schema as ZodTypeAny);
    case "ZodObject": {
      const shape = (def.shape as () => Record<string, ZodTypeAny>)();
      const next: Record<string, ZodTypeAny> = {};
      for (const [key, value] of Object.entries(shape)) next[key] = stripSchemaDefaults(value);
      return z.object(next);
    }
    case "ZodArray": {
      let arr = z.array(stripSchemaDefaults(def.type as ZodTypeAny));
      const min = def.minLength as { value: number } | null;
      const max = def.maxLength as { value: number } | null;
      const exact = def.exactLength as { value: number } | null;
      if (min) arr = arr.min(min.value);
      if (max) arr = arr.max(max.value);
      if (exact) arr = arr.length(exact.value);
      return arr;
    }
    default:
      return schema;
  }
}
