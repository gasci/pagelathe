---
"pagelathe": minor
---

Add native **Gemini** and **OpenAI** providers alongside OpenRouter.

- Store a key per provider with `pagelathe config set-key --provider <openrouter|gemini|openai>`
  (or the `OPENROUTER_API_KEY` / `GEMINI_API_KEY` (or `GOOGLE_API_KEY`) / `OPENAI_API_KEY` env vars).
- Choose the active provider with `pagelathe config use <provider>`, set per-provider default
  models with `pagelathe config set-model <id> -p <provider>`, and override per run with
  `pagelathe generate --provider <p> -m <id>`.
- Gemini calls Google's `generateContent` API with JSON structured output; OpenAI uses the
  Chat Completions API with strict `json_schema`. Each key is sent only to that provider's
  official API.
- Existing single-key OpenRouter configs are migrated to the new multi-provider format
  automatically on first load.
