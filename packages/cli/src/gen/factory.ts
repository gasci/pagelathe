import type { Provider } from "../config/schema.js";
import type { LlmClient } from "./llm.js";
import { createOpenAIClient, createOpenRouterClient } from "./provider.js";
import { createGeminiClient } from "./gemini.js";

export interface CreateLlmClientOptions {
  provider: Provider;
  apiKey: string;
  model: string;
  fetchImpl?: typeof fetch;
}

/** Build the LlmClient for the chosen provider. */
export function createLlmClient(opts: CreateLlmClientOptions): LlmClient {
  switch (opts.provider) {
    case "openrouter":
      return createOpenRouterClient({
        apiKey: opts.apiKey,
        model: opts.model,
        appName: "pagelathe",
        fetchImpl: opts.fetchImpl,
      });
    case "openai":
      return createOpenAIClient({
        apiKey: opts.apiKey,
        model: opts.model,
        fetchImpl: opts.fetchImpl,
      });
    case "gemini":
      return createGeminiClient({
        apiKey: opts.apiKey,
        model: opts.model,
        fetchImpl: opts.fetchImpl,
      });
  }
}
