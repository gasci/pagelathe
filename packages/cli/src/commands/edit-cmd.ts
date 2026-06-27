import { join, resolve } from "node:path";
import type { Command } from "commander";
import { stringify as yamlStringify } from "yaml";
import { getSection, pageDocumentSchema } from "@pagelathe/sections";
import { readDocumentYaml, writeDocumentYaml } from "../gen/yaml-doc.js";
import { parsePath, coerceValue, applySet, getAtPath, listLeafPaths } from "../gen/set-path.js";

export interface SetOp {
  path: string;
  value: string;
}
export interface EditChange {
  path: string;
  from: unknown;
  to: unknown;
}
export interface EditResult {
  yamlPath: string;
  sectionId: string;
  props: unknown;
  changes: EditChange[];
  editablePaths: string[];
  written: boolean;
}
export interface EditOptions {
  cwd?: string;
  sectionId: string;
  sets?: SetOp[];
}

export async function runEdit(opts: EditOptions): Promise<EditResult> {
  const cwd = resolve(opts.cwd ?? process.cwd());
  const yamlPath = join(cwd, "src", "content", "landing", "index.yaml");
  const doc = readDocumentYaml(yamlPath);

  const section = doc.sections.find((s) => s.id === opts.sectionId);
  if (!section) {
    const ids = doc.sections.map((s) => s.id).join(", ") || "(none)";
    throw new Error(`No section with id "${opts.sectionId}". Available ids: ${ids}`);
  }
  const entry = getSection(section.type);
  if (!entry) throw new Error(`Unknown section type "${section.type}".`);
  const schema = entry.propsSchema;
  const editablePaths = listLeafPaths(section.props);

  const sets = opts.sets ?? [];
  if (sets.length === 0) {
    return {
      yamlPath,
      sectionId: section.id,
      props: section.props,
      changes: [],
      editablePaths,
      written: false,
    };
  }

  let working = section.props;
  const changes: EditChange[] = [];
  for (const { path: pathStr, value } of sets) {
    const path = parsePath(pathStr);
    let coerced: unknown;
    try {
      coerced = coerceValue(schema, path, value);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`${msg}\nEditable fields: ${editablePaths.join(", ")}`);
    }
    const from = getAtPath(working, path);
    working = applySet(working, path, coerced);
    changes.push({ path: pathStr, from, to: coerced });
  }

  // Keystone: re-validate the section, then the whole document, BEFORE writing.
  const validated = schema.parse(working);
  section.props = validated;
  pageDocumentSchema.parse(doc);
  writeDocumentYaml(doc, yamlPath);

  return {
    yamlPath,
    sectionId: section.id,
    props: validated,
    changes,
    editablePaths,
    written: true,
  };
}

function collectSet(raw: string, acc: SetOp[]): SetOp[] {
  const i = raw.indexOf("=");
  if (i < 0) throw new Error(`--set expects path=value, got "${raw}".`);
  acc.push({ path: raw.slice(0, i), value: raw.slice(i + 1) });
  return acc;
}

export function registerEditCommand(program: Command): void {
  program
    .command("edit <sectionId>")
    .description("edit fields of one section in index.yaml (no LLM, schema-validated)")
    .option(
      "--set <path=value>",
      "set a field; repeatable (e.g. --set ctas.0.label=Star)",
      collectSet,
      [],
    )
    .option("--cwd <dir>", "project directory (defaults to the working directory)")
    .action(async (sectionId: string, options: { set: SetOp[]; cwd?: string }) => {
      const res = await runEdit({ cwd: options.cwd, sectionId, sets: options.set });
      if (!res.written) {
        console.log(`${res.sectionId}:\n${yamlStringify(res.props)}`);
        console.log(`Editable fields:\n  ${res.editablePaths.join("\n  ")}`);
        console.log(`\nEdit one with:  pagelathe edit ${res.sectionId} --set <field>=<value>`);
        return;
      }
      console.log(`✓ Edited ${res.sectionId} → ${res.yamlPath}`);
      for (const c of res.changes) {
        console.log(`  ${c.path}: ${JSON.stringify(c.from)} → ${JSON.stringify(c.to)}`);
      }
    });
}
