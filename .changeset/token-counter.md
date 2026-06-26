---
"pagelathe": minor
---

Add a live **token counter** and spend guard to `generate`. The CLI now shows a running token
total during generation and a final summary (prompt / completion / total), read from each
provider's real usage (OpenAI/OpenRouter `usage`, Gemini `usageMetadata`) — including retries.
A `--max-tokens <n>` budget (default 100,000; `0` disables) pauses and asks before exceeding it:
continue or abort. Non-interactive runs fail safe (abort), and aborting writes nothing.
