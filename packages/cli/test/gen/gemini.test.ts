import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createGeminiClient } from "../../src/gen/gemini.js";
import { LlmError } from "../../src/gen/llm.js";

function reply(text: string) {
  return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const schema = z.object({ archetype: z.enum(["sdk-infra", "technical-app", "general"]) });

describe("createGeminiClient", () => {
  it("calls generateContent with the key in a header and a sanitized responseSchema", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply('{"archetype":"sdk-infra"}'));
    const client = createGeminiClient({
      apiKey: "AIza-secret-key-000",
      model: "gemini-3.5-flash",
      fetchImpl,
    });
    const out = await client.generateObject(schema, { system: "s", prompt: "p" });
    expect(out.archetype).toBe("sdk-infra");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("/models/gemini-3.5-flash:generateContent");
    expect(String(url)).not.toContain("AIza-secret-key-000"); // key not in URL
    expect((init.headers as Record<string, string>)["x-goog-api-key"]).toBe("AIza-secret-key-000");

    const body = JSON.parse(init.body as string);
    expect(body.generationConfig.responseMimeType).toBe("application/json");
    expect(body.generationConfig.responseSchema.type).toBe("object");
    // sanitized: no JSON-Schema-only keywords
    expect(JSON.stringify(body.generationConfig.responseSchema)).not.toContain(
      "additionalProperties",
    );
    expect(body.systemInstruction.parts[0].text).toBe("s");
    expect(body.contents[0].role).toBe("user");
  });

  it("retries with the validation error appended as a model+user turn, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply('{"archetype":"nonsense"}'))
      .mockResolvedValueOnce(reply('{"archetype":"general"}'));
    const client = createGeminiClient({ apiKey: "AIza-x-0000000000", model: "m", fetchImpl });
    const out = await client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 1 });
    expect(out.archetype).toBe("general");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const body = JSON.parse(fetchImpl.mock.calls[1][1].body as string);
    expect(body.contents.some((c: { role: string }) => c.role === "model")).toBe(true);
    expect(JSON.stringify(body.contents)).toMatch(/valid|invalid|error/i);
  });

  it("retries a 5xx but not a 4xx", async () => {
    const fail4xx = vi.fn().mockResolvedValue(new Response("bad", { status: 400 }));
    const c1 = createGeminiClient({ apiKey: "AIza-x-0000000000", model: "m", fetchImpl: fail4xx });
    await expect(
      c1.generateObject(schema, { system: "s", prompt: "p", maxRetries: 2 }),
    ).rejects.toBeInstanceOf(LlmError);
    expect(fail4xx).toHaveBeenCalledTimes(1);

    const fail5xx = vi.fn().mockResolvedValue(new Response("boom", { status: 503 }));
    const c2 = createGeminiClient({ apiKey: "AIza-x-0000000000", model: "m", fetchImpl: fail5xx });
    await expect(
      c2.generateObject(schema, { system: "s", prompt: "p", maxRetries: 2 }),
    ).rejects.toBeInstanceOf(LlmError);
    expect(fail5xx).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it("throws LlmError without leaking the key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply("not json"));
    const client = createGeminiClient({ apiKey: "AIza-secret-key-000", model: "m", fetchImpl });
    try {
      await client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 0 });
      throw new Error("should have thrown");
    } catch (e) {
      expect((e as Error).name).toBe("LlmError");
      expect(String((e as Error).message)).not.toContain("AIza-secret-key-000");
    }
  });
});
