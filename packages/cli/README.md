# pagelathe

> AI landing-page builder for technical founders. Bring your key, describe your product, and
> ship a fast, on-brand **static Astro** landing page in minutes — then let pagelathe measure
> it and tell you how to reorder sections to convert better.

[![npm version](https://img.shields.io/npm/v/pagelathe.svg)](https://www.npmjs.com/package/pagelathe)
[![CI](https://github.com/gasci/pagelathe/actions/workflows/ci.yml/badge.svg)](https://github.com/gasci/pagelathe/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/gasci/pagelathe/blob/main/LICENSE)
[![GitHub Repo stars](https://img.shields.io/github/stars/gasci/pagelathe?style=flat&logo=github&label=Star%20on%20GitHub)](https://github.com/gasci/pagelathe)

Every AI site builder spits out a generic React app. pagelathe is built for **developer
tools**: code-snippet heroes, multi-language API examples, GitHub/self-host CTAs, honest
pricing, and anti-fluff copy — emitted as a **static Astro project you fully own** that scores
~100 on Lighthouse by default.

## Install

```bash
npm install -g pagelathe
```

> **Prerequisites:** Node ≥20.11 for the `pagelathe` CLI; **Node ≥22** to run or build the
> generated Astro site (the `pnpm dev` / `pnpm build` steps below).

## Quick start

```bash
pagelathe config set-key --provider gemini   # paste your Gemini key (AIza…)
pagelathe config use gemini                  # make Gemini your default provider
pagelathe init my-landing && cd my-landing
pagelathe generate -d "A Postgres branching service for teams"
pnpm install && pnpm dev                     # http://localhost:4321
```

> Prefer OpenRouter or OpenAI? Drop the first two lines (OpenRouter is the default) or swap
> `gemini` for `openai`. See [Providers & API keys](#providers--api-keys) for all three.

`generate` classifies your product, plans the sections, and fills on-brand copy and code — all
bounded by each section's schema, so output is always valid. Edit the generated
`src/content/landing/index.yaml` or any `src/components/sections/*` to make it yours. Scaffolded
projects build standalone — no monorepo required.

## Commands

| Command                           | What it does                                                          |
| --------------------------------- | --------------------------------------------------------------------- |
| `pagelathe config set-key [key]`  | Store an API key for a provider (`-p <provider>`, prompts if omitted) |
| `pagelathe config use <provider>` | Set the active provider: `openrouter`, `gemini`, or `openai`          |
| `pagelathe config set-model <id>` | Set the default model for a provider (`-p <provider>`)                |
| `pagelathe config show`           | Show providers, keys (masked), and default models                     |
| `pagelathe init [dir]`            | Scaffold a new pagelathe landing project (`-f, --force`)              |
| `pagelathe generate`              | Generate an on-brand landing page from a product description          |
| `pagelathe add <section>`         | Vendor a section component from the registry into your project        |
| `pagelathe --version`             | Print the installed version                                           |

### `generate` options

- `-d, --description <text>` — product description (skips the interactive prompt)
- `-p, --provider <name>` — `openrouter` (default), `gemini`, or `openai` — overrides the active provider for this run
- `-m, --model <id>` — model id (defaults to the active provider's configured model)

Run any command with `--help` for full usage.

## Providers & API keys

pagelathe is local-first and bring-your-own-key. It talks to three providers directly — use
whichever you have a key for:

| Provider                      | Key looks like | Env var              | Get a key                                                   |
| ----------------------------- | -------------- | -------------------- | ----------------------------------------------------------- |
| **OpenRouter** (default)      | `sk-or-…`      | `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai)                      |
| **Gemini** (Google AI Studio) | `AIza…`        | `GEMINI_API_KEY`     | [aistudio.google.com](https://aistudio.google.com/apikey)   |
| **OpenAI**                    | `sk-…`         | `OPENAI_API_KEY`     | [platform.openai.com](https://platform.openai.com/api-keys) |

```bash
# Use Gemini directly with your Google AI Studio key
pagelathe config set-key --provider gemini   # paste AIza…  (or export GEMINI_API_KEY)
pagelathe config use gemini                  # make Gemini the active provider
pagelathe generate -d "A Postgres branching service for teams"

# …or override per run without changing your default
pagelathe generate --provider openai -m gpt-5.5 -d "A Postgres branching service for teams"
```

Default models are `anthropic/claude-3.7-sonnet` (OpenRouter), `gemini-3.5-flash` (Gemini), and
`gpt-5.5` (OpenAI). Change one with `pagelathe config set-model <id> -p <provider>`, and run
`pagelathe config show` to see every provider's key status and default model at a glance.

Every key is stored only on your machine — at `~/.pagelathe/config.json` (mode `0600`) or via the
matching environment variable — and each key is sent **only to that provider's official API**
(OpenRouter, Google, or OpenAI). Keys are never logged, printed in full, or transmitted anywhere
else. See [SECURITY.md](https://github.com/gasci/pagelathe/blob/main/SECURITY.md).

## Status

🚧 **Early and moving fast.** Generation (`pagelathe generate`) is live; the observational
**optimize loop** (measure → suggest section reorderings from real analytics) is on the
[roadmap](https://github.com/gasci/pagelathe/blob/main/ROADMAP.md).

## Contributing

pagelathe is **free and open source** (Apache-2.0), built in the open at
**[github.com/gasci/pagelathe](https://github.com/gasci/pagelathe)**. It's early and moving
fast, so contributions land quickly and genuinely shape where the project goes.

The highest-leverage way to help is **authoring a landing-page section** — a self-contained
Astro component plus its schema. Every section you add becomes a building block the generator
can reach for, so your work ships to everyone who runs `pagelathe generate`. Also very welcome:
new model providers, bug reports with a repro, docs, and honest feedback on the generated sites.

- ⭐ **[Star the repo](https://github.com/gasci/pagelathe)** to follow along and help others find it
- 🧩 **Add a section** — start with [CONTRIBUTING.md](https://github.com/gasci/pagelathe/blob/main/CONTRIBUTING.md)
- 🐛 **[Browse open issues](https://github.com/gasci/pagelathe/issues)** for bugs to fix or features to build

New to open source? This is a friendly place to start — open an issue to say hi and we'll help
you land your first PR.

## Links

- 📖 [Source, docs & full design on GitHub](https://github.com/gasci/pagelathe)
- 🐛 [Report an issue](https://github.com/gasci/pagelathe/issues)
- 🤝 [Contributing guide](https://github.com/gasci/pagelathe/blob/main/CONTRIBUTING.md)

## License

[Apache-2.0](https://github.com/gasci/pagelathe/blob/main/LICENSE). "pagelathe" is a project
trademark — see [TRADEMARK.md](https://github.com/gasci/pagelathe/blob/main/TRADEMARK.md).
