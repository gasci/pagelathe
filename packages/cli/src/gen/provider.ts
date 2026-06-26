import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";
import type { LlmClient, LlmGenerateOptions } from "./llm.js";
import { LlmError } from "./llm.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatClientConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  extraHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

/**
 * Client for any OpenAI-compatible Chat Completions endpoint with strict
 * `json_schema` structured output (OpenRouter and OpenAI both qualify).
 */
function createChatCompletionsClient(config: ChatClientConfig): LlmClient {
  const fetchImpl = config.fetchImpl ?? fetch;

  async function callOnce(
    messages: ChatMessage[],
    schemaName: string,
    jsonSchema: unknown,
  ): Promise<string> {
    const res = await fetchImpl(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        ...(config.extraHeaders ?? {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        response_format: {
          type: "json_schema",
          json_schema: { name: schemaName, strict: true, schema: jsonSchema },
        },
      }),
    });
    if (!res.ok) {
      throw new LlmError(`Provider request failed (HTTP ${res.status}).`, {
        status: res.status,
      });
    }
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new LlmError("Provider returned no content.");
    return content;
  }

  return {
    async generateObject<T>(schema: ZodType<T>, options: LlmGenerateOptions): Promise<T> {
      const maxRetries = options.maxRetries ?? 2;
      const schemaName = options.schemaName ?? "result";
      // Inline the schema (no $ref/definitions wrapper): OpenRouter/OpenAI
      // strict structured-output requires the root to be a plain object schema.
      const jsonSchema = zodToJsonSchema(schema, { $refStrategy: "none" });
      const messages: ChatMessage[] = [
        { role: "system", content: options.system },
        {
          role: "user",
          content: `${options.prompt}\n\nReturn ONLY a JSON object that matches the schema. No prose, no markdown fences.`,
        },
      ];
      let lastErr = "";
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let content: string;
        try {
          content = await callOnce(messages, schemaName, jsonSchema);
        } catch (err) {
          if (
            err instanceof LlmError &&
            err.detail?.status !== undefined &&
            err.detail.status >= 500 &&
            attempt < maxRetries
          ) {
            continue; // transient server error: retry
          }
          throw err instanceof LlmError ? err : new LlmError("Provider request error.");
        }
        const parsed = safeJson(content);
        const result = parsed === undefined ? undefined : schema.safeParse(parsed);
        if (result?.success) return result.data;
        lastErr =
          result && !result.success
            ? JSON.stringify(result.error.issues)
            : "Output was not valid JSON.";
        messages.push({ role: "assistant", content });
        messages.push({
          role: "user",
          content: `That output was invalid: ${lastErr}\nReturn a corrected JSON object that matches the schema exactly.`,
        });
      }
      throw new LlmError(
        `Model did not produce schema-valid output after ${maxRetries + 1} attempts.`,
        { attempts: maxRetries + 1 },
      );
    },
  };
}

export interface OpenRouterOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  appUrl?: string;
  appName?: string;
}

export function createOpenRouterClient(opts: OpenRouterOptions): LlmClient {
  const extraHeaders: Record<string, string> = {};
  if (opts.appUrl) extraHeaders["HTTP-Referer"] = opts.appUrl;
  if (opts.appName) extraHeaders["X-Title"] = opts.appName;
  return createChatCompletionsClient({
    apiKey: opts.apiKey,
    model: opts.model,
    baseUrl: opts.baseUrl ?? OPENROUTER_BASE_URL,
    extraHeaders,
    fetchImpl: opts.fetchImpl,
  });
}

export interface OpenAIOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

export function createOpenAIClient(opts: OpenAIOptions): LlmClient {
  return createChatCompletionsClient({
    apiKey: opts.apiKey,
    model: opts.model,
    baseUrl: opts.baseUrl ?? OPENAI_BASE_URL,
    fetchImpl: opts.fetchImpl,
  });
}

function safeJson(text: string): unknown {
  const trimmed = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    return undefined;
  }
}
