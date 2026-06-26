import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createOpenRouterClient } from "../../src/gen/provider.js";
import { LlmError } from "../../src/gen/llm.js";

function reply(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const schema = z.object({ archetype: z.enum(["sdk-infra", "technical-app", "general"]) });

describe("createOpenRouterClient", () => {
  it("returns a validated object and sends the key only in the Authorization header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply('{"archetype":"sdk-infra"}'));
    const client = createOpenRouterClient({ apiKey: "sk-or-secret", model: "x/y", fetchImpl });
    const out = await client.generateObject(schema, { system: "s", prompt: "p" });
    expect(out.archetype).toBe("sdk-infra");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("/chat/completions");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe("Bearer sk-or-secret");
    expect(init.body).not.toContain("sk-or-secret"); // key never in the body
    // The JSON schema must be strict-mode compatible for OpenRouter/OpenAI
    // structured output: inline (no $ref) with additionalProperties:false.
    const body = JSON.parse(init.body as string);
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.response_format.json_schema.schema.additionalProperties).toBe(false);
    expect("$ref" in body.response_format.json_schema.schema).toBe(false);
  });

  it("retries with the validation error appended, then succeeds", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(reply('{"archetype":"nonsense"}'))
      .mockResolvedValueOnce(reply('{"archetype":"general"}'));
    const client = createOpenRouterClient({ apiKey: "sk-or-x", model: "x/y", fetchImpl });
    const out = await client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 1 });
    expect(out.archetype).toBe("general");
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    // second call's messages must include the previous invalid output's error
    const body = JSON.parse(fetchImpl.mock.calls[1][1].body as string);
    expect(JSON.stringify(body.messages)).toMatch(/valid|invalid|error/i);
  });

  it("throws LlmError after exhausting retries, without leaking the key", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply("not json at all"));
    const client = createOpenRouterClient({ apiKey: "sk-or-secret", model: "x/y", fetchImpl });
    await expect(
      client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 1 }),
    ).rejects.toMatchObject({ name: "LlmError" });
    try {
      await client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 0 });
    } catch (e) {
      expect(String((e as Error).message)).not.toContain("sk-or-secret");
    }
  });

  it("maps a non-200 response to LlmError", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("rate limited", { status: 429 }));
    const client = createOpenRouterClient({ apiKey: "sk-or-x", model: "x/y", fetchImpl });
    await expect(
      client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 0 }),
    ).rejects.toBeInstanceOf(LlmError);
  });

  it("does NOT retry a 4xx error (client error throws on first attempt)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("bad request", { status: 422 }));
    const client = createOpenRouterClient({ apiKey: "sk-or-x", model: "x/y", fetchImpl });
    await expect(
      client.generateObject(schema, { system: "s", prompt: "p", maxRetries: 2 }),
    ).rejects.toBeInstanceOf(LlmError);
    expect(fetchImpl).toHaveBeenCalledTimes(1); // 4xx not retried despite maxRetries: 2
  });

  it("reports token usage via onUsage", async () => {
    const seen: unknown[] = [];
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: '{"archetype":"general"}' } }],
          usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 },
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );
    const client = createOpenRouterClient({
      apiKey: "sk-or-x",
      model: "x/y",
      fetchImpl,
      onUsage: (u) => seen.push(u),
    });
    await client.generateObject(schema, { system: "s", prompt: "p" });
    expect(seen).toEqual([{ promptTokens: 100, completionTokens: 40, totalTokens: 140 }]);
  });
});
