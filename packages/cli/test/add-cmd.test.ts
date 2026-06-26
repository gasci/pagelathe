import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { runAdd } from "../src/commands/add-cmd.js";

const tmps: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), "pl-add-"));
  tmps.push(d);
  return d;
}
afterEach(() => {
  for (const d of tmps.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe("runAdd", () => {
  it("vendors a known section into the project", async () => {
    const cwd = tmp();
    const { written } = await runAdd("pricing", { cwd });
    expect(existsSync(written)).toBe(true);
    expect(written.endsWith(join("src", "components", "sections", "pricing.astro"))).toBe(true);
  });
  it("throws on an unknown section and lists options", async () => {
    await expect(runAdd("nope", { cwd: tmp() })).rejects.toThrow(/Unknown section/);
  });
  it("refuses to overwrite without --force", async () => {
    const cwd = tmp();
    const dest = join(cwd, "src/components/sections/pricing.astro");
    mkdirSync(join(cwd, "src/components/sections"), { recursive: true });
    writeFileSync(dest, "// existing");
    await expect(runAdd("pricing", { cwd })).rejects.toThrow(/exists/);
    await expect(runAdd("pricing", { cwd, force: true })).resolves.toBeTruthy();
  });
});
