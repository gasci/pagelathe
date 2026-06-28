# pagelathe

## 0.9.0

### Minor Changes

- 843a3ec: Generated landing pages now support light and dark mode. Pages default to the
  visitor's OS color-scheme preference and include a persisted toggle (top-right)
  with no flash of the wrong theme on load. Section components were refactored onto
  a semantic color-token layer, and code snippets follow the active theme via
  Shiki dual themes.

## 0.8.0

### Minor Changes

- 5c02ee4: Add section inspection & management commands: `pagelathe list` (sections + their content
  children), `pagelathe show [sectionId]` (pretty-print the whole page or one section, `--json`
  supported), and `pagelathe remove <sectionId>`. `pagelathe add <type>` now also appends the
  section to `index.yaml` with default props and a fresh id (`--before`/`--after` for placement),
  instead of only vendoring the component file — run `pagelathe edit <id>` to fill it on-brand.

## 0.7.1

### Patch Changes

- 4cf15d5: Fix an inaccurate `edit` example in the bundled `SKILL.md`. Section ids are `<type>-1` (e.g.
  `hero-1`), so the example now reads `pagelathe edit hero-1 -i "…"` instead of `pagelathe edit
hero`, with a note clarifying that `edit` takes a section **id** while `add` takes the bare type.

## 0.7.0

### Minor Changes

- e20c022: Ship an agent skill (`SKILL.md`) with the package. The skill teaches AI coding agents when and
  how to drive the `pagelathe` CLI — generate, add, edit, and preview — instead of hand-writing
  Astro. Bundled in the npm tarball and usable as a Claude Code / Agent Skills skill.

## 0.6.0

### Minor Changes

- bf60b1b: Replace `pagelathe edit --set <path>=<value>` with prompt-based section editing:
  `pagelathe edit <sectionId> -i "<instruction>"`. The model revises only the targeted section,
  bounded by that section's schema, and prints a before→after diff. To prevent silent data loss,
  schema defaults are stripped for the edit call so the model must echo every previously-set field
  (an omission re-prompts instead of resetting a value). It reuses `generate`'s provider/model
  selection and prints the tokens used. Run `pagelathe edit <sectionId>` with no `-i` to be prompted
  for the instruction.

## 0.5.0

### Minor Changes

- ad602b9: Add `pagelathe edit <sectionId> --set <path>=<value>` — deterministic, no-LLM editing of a single
  section's fields in `index.yaml`. Supports nested and array paths (`ctas.0.label`), coerces values
  using the section's schema, and re-validates before an atomic write so the rest of the page is
  untouched. Run `pagelathe edit <sectionId>` with no `--set` to inspect a section's fields.

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
