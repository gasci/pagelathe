# pagelathe

> AI landing-page builder for technical founders. Bring your key, describe your product, and
> ship a fast, on-brand **static Astro** landing page in minutes — then let pagelathe measure
> it and tell you how to reorder sections to convert better.

[![CI](https://github.com/gasci/pagelathe/actions/workflows/ci.yml/badge.svg)](https://github.com/gasci/pagelathe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Why pagelathe

Every AI site builder spits out a generic React app. pagelathe is built for **developer
tools**: code-snippet heroes, multi-language API examples, GitHub/self-host CTAs, honest
pricing, and anti-fluff copy — emitted as a **static Astro project you fully own** that scores
~100 on Lighthouse by default.

## Status

🚧 **Early and moving fast.** **M1 (foundation)** and **M2 (app engine + section registry)**
are done. **M3 (generation)** is now in: `pagelathe generate` classifies your product, plans
sections, and fills on-brand copy and code — scaffolded projects build standalone with no
monorepo required. The **optimize loop** (measure → suggest reorderings) is coming in
**M4**. See the [roadmap](./ROADMAP.md).

## Quick start

```bash
npm install -g pagelathe
pagelathe config set-key                 # your OpenRouter key (stored locally)
pagelathe init my-landing && cd my-landing
pagelathe generate -d "A TypeScript SDK for sending transactional email"
pnpm install && pnpm dev                 # http://localhost:4321
```

> **Prerequisites:** Node ≥20.11 for the `pagelathe` CLI; **Node ≥22** to run or build the
> generated Astro site (the `pnpm dev` / `pnpm build` steps above).

Prefer the **Gemini API** directly (or OpenAI) instead of OpenRouter? Set that provider's key and
make it active. `generate` **scaffolds the project for you** when the folder isn't one yet, so no
separate `init` is needed:

```bash
mkdir my-landing && cd my-landing            # a fresh folder for your site
pagelathe config set-key --provider gemini   # paste your Gemini key (AIza…), or set GEMINI_API_KEY
pagelathe config use gemini                  # make Gemini your default provider
pagelathe generate -d "A TypeScript SDK for sending transactional email"   # scaffolds + fills the project
pnpm install && pnpm dev                     # http://localhost:4321
# OpenAI is identical: --provider openai (defaults to gpt-5.5)
```

`generate` classifies your product, plans the sections, and fills on-brand copy and code —
all bounded by each section's schema, so output is always valid. Edit the generated
`src/content/landing/index.yaml` or any `src/components/sections/*` to make it yours.

Each provider key is stored only on your machine and sent only to that provider's official API
(OpenRouter, Google, or OpenAI) — never logged or sent anywhere else. See
[SECURITY.md](./SECURITY.md).

## Tweak your page

Iterate with prompts and commands:

```bash
# Re-prompt: regenerate from a sharper description (overwrites index.yaml + section content)
pagelathe generate -d "A TypeScript SDK for sending transactional email — lead with the 3-line install"
pagelathe generate                         # run with no -d to be prompted interactively

# Different voice: regenerate with another provider (uses that provider's default model)
pagelathe generate --provider gemini -d "A TypeScript SDK for sending transactional email"

# Add a section component from the registry (run with a bad name to list them all)
pagelathe add codeDemo
```

For surgical, prompt-free edits, change the generated files directly — output stays valid because
every section is schema-bounded:

- `src/content/landing/index.yaml` — copy, section order, and which sections appear
- `src/components/sections/*.astro` — markup and styling

> ⚠️ Re-running `generate` regenerates the **whole** page and overwrites `index.yaml`, so commit
> any hand-edits you want to keep first.

## Repository tour

Most of the repository root is standard OSS governance — you only need a few places to get
oriented:

| Want to…              | Look at                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| Use the CLI           | [`packages/cli/`](./packages/cli) — the `pagelathe` command                                         |
| Add or edit a section | [`registry/sections/`](./registry/sections) — one folder per section (Zod schema + Astro component) |
| See the site engine   | [`registry/app/`](./registry/app) — the Astro project `init` scaffolds                              |

Everything else at the root (`LICENSE`, `GOVERNANCE.md`, `SECURITY.md`, the per-tool AI-agent
guides, CI config) is governance and tooling you can ignore until you need it.

## Contributing

We'd love your help — **authoring landing-page sections is the highest-impact contribution**.
There's a concrete, ~20-minute walkthrough: [Adding a section](./docs/contributing/adding-a-section.md).
For everything else, start with [CONTRIBUTING.md](./CONTRIBUTING.md) and our
[Code of Conduct](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE). "pagelathe" is a project trademark — see [TRADEMARK.md](./TRADEMARK.md).
