# pagelathe

## 0.4.1

### Patch Changes

- 0a839f8: Docs: richer, more useful npm README. Swap the running example from a Postgres database to a
  **TypeScript SDK** product, add an **"Example prompts"** gallery of diverse developer-tool
  descriptions and a **"What you get"** section (project layout + `pnpm dev`/`pnpm build`), and
  document the new `--max-tokens` flag plus the live token-cost summary. (Root README example kept
  in sync.)

## 0.4.0

### Minor Changes

- 1150143: Add a live **token counter** and spend guard to `generate`. The CLI now shows a running token
  total during generation and a final summary (prompt / completion / total), read from each
  provider's real usage (OpenAI/OpenRouter `usage`, Gemini `usageMetadata`) — including retries.
  A `--max-tokens <n>` budget (default 100,000; `0` disables) pauses and asks before exceeding it:
  continue or abort. Non-interactive runs fail safe (abort), and aborting writes nothing.

### Patch Changes

- a2010fe: Section polish: make the **header proportional on mobile** (compact CTA that stays on one
  line and truncates past 55vw instead of wrapping, a non-shrinking logo, and tighter
  padding/gaps on small screens), and **keep footer text short** by bounding the footer
  `brand`/`tagline`/`copyright` and column heading/label fields to tight max lengths.

## 0.3.1

### Patch Changes

- 53e2415: Relicense from Apache-2.0 to MIT. The published package's `license` field is now `MIT`,
  and the repository `LICENSE` is the MIT License (the Apache-only `NOTICE` file is removed).
  Prior published versions remain under the license they shipped with.

## 0.3.0

### Minor Changes

- 513b73a: `generate` now scaffolds a runnable Astro project automatically when run in a folder that isn't
  one yet — so `pagelathe generate -d "…"` followed by `pnpm install && pnpm dev` works without a
  separate `pagelathe init`. Run inside an existing project (a `package.json` is present) and it
  leaves the scaffold untouched and only updates the generated content. `init` remains available
  for explicitly scaffolding an empty named directory.

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
