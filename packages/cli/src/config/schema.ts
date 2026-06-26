import { z } from "zod";

export const pagelatheConfigSchema = z.object({
  version: z.literal(1).default(1),
  provider: z
    .object({
      /** OpenRouter API key (may instead come from env at read time). */
      openrouterKey: z.string().min(1).optional(),
      /** Default model id shown first in the picker. */
      defaultModel: z.string().min(1).default("anthropic/claude-3.7-sonnet"),
    })
    .default({ defaultModel: "anthropic/claude-3.7-sonnet" }),
});

export type PagelatheConfig = z.infer<typeof pagelatheConfigSchema>;

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}
