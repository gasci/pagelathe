import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runInit } from "../src/commands/init-cmd.js";

const tmps: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "pl-init-"));
  tmps.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("runInit", () => {
  it("scaffolds the app engine and vendors the default sections", async () => {
    const dest = join(tmp(), "site");
    await runInit(dest);
    expect(existsSync(join(dest, "astro.config.mjs"))).toBe(true);
    expect(existsSync(join(dest, "src/content/landing/index.yaml"))).toBe(true);
    expect(existsSync(join(dest, "src/components/sections/hero.astro"))).toBe(true);
    expect(existsSync(join(dest, "src/components/sections/footer.astro"))).toBe(true);
  });
  it("refuses a non-empty directory without --force", async () => {
    const dest = tmp();
    mkdirSync(join(dest, "sub"), { recursive: true });
    writeFileSync(join(dest, "keep.txt"), "x");
    await expect(runInit(dest)).rejects.toThrow(/not empty/);
  });
  it("scaffolds a non-empty directory with --force", async () => {
    const dest = tmp();
    writeFileSync(join(dest, "keep.txt"), "x");
    await expect(runInit(dest, { force: true })).resolves.toBeTruthy();
    expect(existsSync(join(dest, "astro.config.mjs"))).toBe(true);
  });
});
