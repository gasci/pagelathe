import { describe, expect, it } from "vitest";
import type { ZodType } from "zod";
import { classifyArchetype } from "../../src/gen/archetype.js";
import type { LlmClient } from "../../src/gen/llm.js";

function fakeClient(value: unknown): LlmClient {
  return {
    generateObject: <T>(schema: ZodType<T>) => Promise.resolve(schema.parse(value)),
  };
}

describe("classifyArchetype", () => {
  it("returns the archetype the model picks", async () => {
    const out = await classifyArchetype(
      "a Postgres driver",
      fakeClient({ archetype: "sdk-infra", reason: "db driver" }),
    );
    expect(out).toBe("sdk-infra");
  });
  it("propagates schema validation (invalid archetype rejected by the fake's parse)", async () => {
    await expect(
      classifyArchetype("x", fakeClient({ archetype: "nope", reason: "" })),
    ).rejects.toBeTruthy();
  });
});
