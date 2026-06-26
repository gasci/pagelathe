#!/usr/bin/env node
/**
 * vendor-sections.mjs
 *
 * Copies registry/sections/<type>/section.astro into
 * registry/app/src/components/sections/<type>.astro (flattened).
 *
 * Run with --clean to remove vendored copies (keeping .gitkeep).
 *
 * NOTE: The vendored .astro files contain `import type { propsSchema } from "./schema.js"`.
 * That import is type-only and is erased at build by esbuild under verbatimModuleSyntax —
 * the missing ./schema.js is never resolved at build time.
 */

import { copyFileSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = join(__dirname, "..");
const sectionsRoot = join(appRoot, "..", "sections");
const destDir = join(appRoot, "src", "components", "sections");

// The 7 R-set section types (mirrors sectionModules order in registry.ts)
const SECTION_TYPES = ["hero", "header", "footer", "features", "codeDemo", "pricing", "finalCta"];

const isClean = process.argv.includes("--clean");

if (isClean) {
  for (const type of SECTION_TYPES) {
    const dest = join(destDir, `${type}.astro`);
    if (existsSync(dest)) {
      rmSync(dest);
      console.log(`[vendor-sections] removed ${type}.astro`);
    }
  }
  console.log("[vendor-sections] clean done");
} else {
  for (const type of SECTION_TYPES) {
    const src = join(sectionsRoot, type, "section.astro");
    const dest = join(destDir, `${type}.astro`);
    if (!existsSync(src)) {
      console.error(`[vendor-sections] ERROR: source not found: ${src}`);
      process.exit(1);
    }
    copyFileSync(src, dest);
    console.log(`[vendor-sections] copied ${type}.astro`);
  }
  console.log("[vendor-sections] done");
}
