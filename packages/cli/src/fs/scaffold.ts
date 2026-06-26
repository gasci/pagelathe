import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  rmSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

const COPY_SKIP = new Set(["node_modules", "dist", ".astro"]);

/** Recursively copy a directory, skipping build artifacts and vendored
 *  section components (those are placed explicitly by the caller). */
export function copyAppTemplate(srcDir: string, destDir: string): string[] {
  const created: string[] = [];
  cpSync(srcDir, destDir, {
    recursive: true,
    filter: (src) => {
      const base = src.split(/[\\/]/).pop() ?? "";
      if (COPY_SKIP.has(base)) return false;
      // never copy already-vendored section components from the template
      if (/[\\/]src[\\/]components[\\/]sections[\\/].+\.astro$/.test(src)) return false;
      return true;
    },
  });
  created.push(destDir);
  return created;
}

export function isNonEmptyDir(dir: string): boolean {
  if (!existsSync(dir)) return false;
  return readdirSync(dir).filter((n) => n !== ".git").length > 0;
}

export function copyInto(srcFile: string, destFile: string): void {
  mkdirSync(dirname(destFile), { recursive: true });
  copyFileSync(srcFile, destFile);
}

/**
 * Strip monorepo-only build machinery from a scaffolded project so its output
 * is correct standalone. The app template's `prebuild` vendors sections from
 * the monorepo registry — but `init` already vendors them directly, so the
 * scaffold needs neither the `vendor-sections.mjs` helper nor the
 * `prebuild`/`clean:sections` scripts that reference it (they would fail).
 */
export function finalizeScaffold(destDir: string): void {
  rmSync(join(destDir, "scripts"), { recursive: true, force: true });
  const pkgPath = join(destDir, "package.json");
  if (!existsSync(pkgPath)) return;
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as {
    scripts?: Record<string, string>;
  };
  if (pkg.scripts) {
    delete pkg.scripts.prebuild;
    delete pkg.scripts["clean:sections"];
  }
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
}
