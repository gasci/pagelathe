import { mkdirSync, writeFileSync, renameSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify as yamlStringify, parse as yamlParse } from "yaml";
import { pageDocumentSchema, type PageDocument } from "@pagelathe/sections";

/** Write `doc` as YAML atomically: temp file in the same dir, then rename. */
export function writeDocumentYaml(doc: unknown, destFile: string): void {
  mkdirSync(dirname(destFile), { recursive: true });
  const tmp = join(dirname(destFile), `.index.yaml.tmp-${process.pid}`);
  writeFileSync(tmp, yamlStringify(doc), "utf8");
  renameSync(tmp, destFile);
}

/** Read `index.yaml`, parse, and validate against the page-document schema. */
export function readDocumentYaml(srcFile: string): PageDocument {
  let text: string;
  try {
    text = readFileSync(srcFile, "utf8");
  } catch {
    throw new Error(`No landing page found at ${srcFile}. Run \`pagelathe generate\` first.`);
  }
  return pageDocumentSchema.parse(yamlParse(text)) as PageDocument;
}
