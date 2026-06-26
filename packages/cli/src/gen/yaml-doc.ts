import { mkdirSync, writeFileSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { stringify as yamlStringify } from "yaml";

/** Write `doc` as YAML atomically: temp file in the same dir, then rename. */
export function writeDocumentYaml(doc: unknown, destFile: string): void {
  mkdirSync(dirname(destFile), { recursive: true });
  const tmp = join(dirname(destFile), `.index.yaml.tmp-${process.pid}`);
  writeFileSync(tmp, yamlStringify(doc), "utf8");
  renameSync(tmp, destFile);
}
