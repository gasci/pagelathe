import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createOpenAIClient } from "../../src/gen/provider.js";

function reply(content: string) {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const schema = z.object({ archetype: z.enum(["sdk-infra", "technical-app", "general"]) });

describe("createOpenAIClient", () => {
  it("calls the OpenAI endpoint with strict json_schema and no OpenRouter headers", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply('{"archetype":"general"}'));
    const client = createOpenAIClient({ apiKey: "sk-proj-secret", model: "gpt-5.5", fetchImpl });
    const out = await client.generateObject(schema, { system: "s", prompt: "p" });
    expect(out.archetype).toBe("general");

    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toBe("https://api.openai.com/v1/chat/completions");
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-proj-secret");
    expect(headers["HTTP-Referer"]).toBeUndefined();
    expect(headers["X-Title"]).toBeUndefined();
    expect(init.body).not.toContain("sk-proj-secret");

    const body = JSON.parse(init.body as string);
    expect(body.model).toBe("gpt-5.5");
    expect(body.response_format.type).toBe("json_schema");
    expect(body.response_format.json_schema.strict).toBe(true);
  });

  it("honors a custom baseUrl (OpenAI-compatible gateways)", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(reply('{"archetype":"sdk-infra"}'));
    const client = createOpenAIClient({
      apiKey: "sk-proj-secret",
      model: "gpt-5.5",
      baseUrl: "https://gateway.example/v1",
      fetchImpl,
    });
    await client.generateObject(schema, { system: "s", prompt: "p" });
    expect(String(fetchImpl.mock.calls[0][0])).toBe("https://gateway.example/v1/chat/completions");
  });
});
