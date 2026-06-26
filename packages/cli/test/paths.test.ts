import { describe, it, expect, afterEach } from "vitest";
import { homedir } from "node:os";
import { join } from "node:path";
import { getConfigDir, getConfigFile } from "../src/config/paths.js";

afterEach(() => {
  delete process.env.PAGELATHE_CONFIG_DIR;
});

describe("config paths", () => {
  it("defaults to ~/.pagelathe", () => {
    delete process.env.PAGELATHE_CONFIG_DIR;
    expect(getConfigDir()).toBe(join(homedir(), ".pagelathe"));
  });

  it("honors PAGELATHE_CONFIG_DIR override", () => {
    process.env.PAGELATHE_CONFIG_DIR = "/tmp/plt-test";
    expect(getConfigDir()).toBe("/tmp/plt-test");
    expect(getConfigFile()).toBe("/tmp/plt-test/config.json");
  });
});
