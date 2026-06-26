import { zodToJsonSchema } from "zod-to-json-schema";
import type { ZodType } from "zod";
import type { LlmClient, LlmGenerateOptions } from "./llm.js";
import { LlmError } from "./llm.js";
import { toGeminiSchema } from "./gemini-schema.js";
import type { UsageSink } from "./usage.js";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export interface GeminiOptions {
  apiKey: string;
  model: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  onUsage?: UsageSink;
}

interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

/**
 * Native Google Gemini client using the `generateContent` endpoint with JSON
 * structured output (`responseMimeType` + `responseSchema`). Mirrors the
 * OpenAI-compatible client's re-prompt-on-invalid repair loop.
 */
export function createGeminiClient(opts: GeminiOptions): LlmClient {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const baseUrl = opts.baseUrl ?? GEMINI_BASE_URL;

  async function callOnce(
    system: string,
    contents: GeminiContent[],
    responseSchema: unknown,
  ): Promise<string> {
    const res = await fetchImpl(`${baseUrl}/models/${opts.model}:generateContent`, {
      method: "POST",
      headers: {
        // Key travels in a header, never the URL (URLs leak into logs/history).
        "x-goog-api-key": opts.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      }),
    });
    if (!res.ok) {
      throw new LlmError(`Gemini request failed (HTTP ${res.status}).`, { status: res.status });
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };
    if (opts.onUsage) {
      const promptTokens = data.usageMetadata?.promptTokenCount ?? 0;
      const completionTokens = data.usageMetadata?.candidatesTokenCount ?? 0;
      opts.onUsage({
        promptTokens,
        completionTokens,
        totalTokens: data.usageMetadata?.totalTokenCount ?? promptTokens + completionTokens,
      });
    }
    const parts = data.candidates?.[0]?.content?.parts;
    const text = parts?.map((p) => p.text ?? "").join("");
    if (typeof text !== "string" || text === "") throw new LlmError("Gemini returned no content.");
    return text;
  }

  return {
    async generateObject<T>(schema: ZodType<T>, options: LlmGenerateOptions): Promise<T> {
      const maxRetries = options.maxRetries ?? 2;
      const responseSchema = toGeminiSchema(zodToJsonSchema(schema, { $refStrategy: "none" }));
      const contents: GeminiContent[] = [
        {
          role: "user",
          parts: [
            {
              text: `${options.prompt}\n\nReturn ONLY a JSON object that matches the schema. No prose, no markdown fences.`,
            },
          ],
        },
      ];
      let lastErr = "";
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        let content: string;
        try {
          content = await callOnce(options.system, contents, responseSchema);
        } catch (err) {
          if (
            err instanceof LlmError &&
            err.detail?.status !== undefined &&
            err.detail.status >= 500 &&
            attempt < maxRetries
          ) {
            continue; // transient server error: retry
          }
          throw err instanceof LlmError ? err : new LlmError("Gemini request error.");
        }
        const parsed = safeJson(content);
        const result = parsed === undefined ? undefined : schema.safeParse(parsed);
        if (result?.success) return result.data;
        lastErr =
          result && !result.success
            ? JSON.stringify(result.error.issues)
            : "Output was not valid JSON.";
        contents.push({ role: "model", parts: [{ text: content }] });
        contents.push({
          role: "user",
          parts: [
            {
              text: `That output was invalid: ${lastErr}\nReturn a corrected JSON object that matches the schema exactly.`,
            },
          ],
        });
      }
      throw new LlmError(
        `Model did not produce schema-valid output after ${maxRetries + 1} attempts.`,
        { attempts: maxRetries + 1 },
      );
    },
  };
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
