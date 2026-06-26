import type { ZodType } from "zod";

export interface LlmGenerateOptions {
  /** System prompt: role, rules, output contract. */
  system: string;
  /** User prompt: the concrete task + context. */
  prompt: string;
  /** Name for the JSON schema (model-facing). Default "result". */
  schemaName?: string;
  /** Retries after the first attempt when output is invalid. Default 2. */
  maxRetries?: number;
}

export interface LlmClient {
  /** Return a value validated against `schema`. On invalid output, re-prompt
   *  with the validation error, up to `maxRetries` times, then throw LlmError. */
  generateObject<T>(schema: ZodType<T>, options: LlmGenerateOptions): Promise<T>;
}

export class LlmError extends Error {
  constructor(
    message: string,
    readonly detail?: { status?: number; attempts?: number },
  ) {
    super(message);
    this.name = "LlmError";
  }
}
