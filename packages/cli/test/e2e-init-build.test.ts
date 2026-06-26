/**
 * e2e-init-build.test.ts — always-on integration gate for `pagelathe init`.
 *
 * DESIGN CHOICE: the brief's original "copy node_modules + run astro build"
 * approach is fragile across environments and cannot install cleanly until
 * @pagelathe/sections is published to npm. Instead, CI builds the app-engine
 * template in place (`pnpm --filter @pagelathe/app-engine build`, Task 12),
 * proving the engine + sections compile; this gate proves `init`'s OUTPUT is
 * structurally complete and schema-valid. A full scaffold-then-`astro build`
 * is intentionally not run here — it returns once the schema package is
 * published and a scaffolded project installs standalone.
 *
 * This gate instead asserts:
 *   1. Structural completeness — all expected files are emitted.
 *   2. Schema validity — the scaffolded index.yaml validates against
 *      pageDocumentSchema (the same Zod schema the Astro content collection
 *      uses at build time).
 *   3. Section order — the document's `sections` array matches DEFAULT_PAGE_SECTIONS
 *      in order, proving the canonical R-set page is emitted correctly.
 *
 * No network access, no `pnpm install` inside the temp dir, no Astro build.
 * Fast and deterministic.
 */
import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import { runInit } from "../src/commands/init-cmd.js";
import { DEFAULT_PAGE_SECTIONS } from "../src/registry/read.js";
import { pageDocumentSchema } from "@pagelathe/sections";

const tmps: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "pl-e2e-"));
  tmps.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("e2e: init scaffolds a schema-valid project", () => {
  it("DEFAULT_PAGE_SECTIONS is the canonical R-set in order", () => {
    // Pin the constant to a literal so a silent shrink/reorder fails here
    // (the other tests derive their expectations from it and would pass blindly).
    expect([...DEFAULT_PAGE_SECTIONS]).toEqual([
      "header",
      "hero",
      "features",
      "codeDemo",
      "pricing",
      "finalCta",
      "footer",
    ]);
  });

  it("emits the expected file structure", async () => {
    const dest = join(tmp(), "site");
    await runInit(dest);

    // App engine files
    expect(existsSync(join(dest, "astro.config.mjs"))).toBe(true);
    expect(existsSync(join(dest, "package.json"))).toBe(true);
    expect(existsSync(join(dest, "src", "content", "landing", "index.yaml"))).toBe(true);

    // All DEFAULT_PAGE_SECTIONS must have a vendored component
    for (const type of DEFAULT_PAGE_SECTIONS) {
      expect(
        existsSync(join(dest, "src", "components", "sections", `${type}.astro`)),
        `missing component for section: ${type}`,
      ).toBe(true);
    }

    // Monorepo-only build machinery must be stripped from the scaffold: init
    // vendors sections directly, so there is no prebuild/vendor step to ship.
    expect(existsSync(join(dest, "scripts", "vendor-sections.mjs"))).toBe(false);
    const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.prebuild).toBeUndefined();
    expect(pkg.scripts?.["clean:sections"]).toBeUndefined();
  });

  it("scaffolded index.yaml validates against pageDocumentSchema", async () => {
    const dest = join(tmp(), "site");
    await runInit(dest);

    const raw = readFileSync(join(dest, "src", "content", "landing", "index.yaml"), "utf8");
    const doc = parseYaml(raw);
    const result = pageDocumentSchema.safeParse(doc);
    expect(result.success, result.success ? "" : JSON.stringify(result.error.issues, null, 2)).toBe(
      true,
    );
  });

  it("document sections array types match DEFAULT_PAGE_SECTIONS in order", async () => {
    const dest = join(tmp(), "site");
    await runInit(dest);

    const raw = readFileSync(join(dest, "src", "content", "landing", "index.yaml"), "utf8");
    const doc = parseYaml(raw) as { sections: { type: string }[] };
    expect(Array.isArray(doc?.sections)).toBe(true);
    const actualTypes = doc.sections.map((s) => s.type);
    expect(actualTypes).toEqual([...DEFAULT_PAGE_SECTIONS]);
  });

  it("scaffolds a standalone-installable project (no workspace deps)", async () => {
    const dest = join(tmp(), "site");
    await runInit(dest);
    const pkg = JSON.parse(readFileSync(join(dest, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    for (const [name, spec] of Object.entries(deps)) {
      expect(spec.startsWith("workspace:"), `${name} is a workspace dep`).toBe(false);
    }
    expect(deps["@pagelathe/sections"]).toBeUndefined();
    // The build toolchain must be present and public so a fresh install builds.
    expect(deps["astro"]).toBeDefined();
    expect(deps["zod"]).toBeDefined();
    expect(deps["@tailwindcss/vite"]).toBeDefined();
  });
});
