# pagelathe

## 0.2.0

### Minor Changes

- 986bc4d: Add native **Gemini** and **OpenAI** providers alongside OpenRouter.

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

## 0.1.1

### Patch Changes

- Add an npm README documenting install, the CLI commands, key handling, and project status so the package page is self-explanatory.

## 0.1.0

### Minor Changes

- 9f0e2b9: Initial CLI foundation: `pagelathe config set-key` / `config show` with a local,
  env-overridable OpenRouter key vault.
- d29a2dc: Add the app engine and section registry: `pagelathe init` scaffolds a buildable
  static Astro + Tailwind v4 landing project with the required-section set, and
  `pagelathe add <section>` vendors additional sections from the registry.
- 9510701: Add `pagelathe generate`: describe your product and get an on-brand landing
  page. The engine classifies the archetype, plans sections, and fills each
  section's content via OpenRouter — bounded by the section schemas so output is
  always valid — then writes `index.yaml` and vendors the chosen sections.
  Scaffolded projects are now standalone-installable.
