import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createLlmClient } from "../../src/gen/factory.js";
import type { Provider } from "../../src/config/schema.js";

const schema = z.object({ archetype: z.enum(["sdk-infra", "general"]) });

function openAiReply() {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: '{"archetype":"general"}' } }] }),
    {
      status: 200,
      headers: { "content-type": "application/json" },
    },
  );
}
function geminiReply() {
  return new Response(
    JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"archetype":"general"}' }] } }] }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

describe("createLlmClient routing", () => {
  const cases: { provider: Provider; reply: () => Response; host: string }[] = [
    { provider: "openrouter", reply: openAiReply, host: "openrouter.ai" },
    { provider: "openai", reply: openAiReply, host: "api.openai.com" },
    { provider: "gemini", reply: geminiReply, host: "generativelanguage.googleapis.com" },
  ];

  for (const { provider, reply, host } of cases) {
    it(`routes ${provider} to ${host}`, async () => {
      const fetchImpl = vi.fn().mockResolvedValue(reply());
      const client = createLlmClient({
        provider,
        apiKey: "test-key-000000000000",
        model: "m",
        fetchImpl,
      });
      await client.generateObject(schema, { system: "s", prompt: "p" });
      expect(String(fetchImpl.mock.calls[0][0])).toContain(host);
    });
  }
});
