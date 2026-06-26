# pagelathe

> AI landing-page builder for technical founders. Bring your key, describe your product, and
> ship a fast, on-brand **static Astro** landing page in minutes — then let pagelathe measure
> it and tell you how to reorder sections to convert better.

[![npm version](https://img.shields.io/npm/v/pagelathe.svg)](https://www.npmjs.com/package/pagelathe)
[![CI](https://github.com/gasci/pagelathe/actions/workflows/ci.yml/badge.svg)](https://github.com/gasci/pagelathe/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://github.com/gasci/pagelathe/blob/master/LICENSE)

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
pagelathe config set-key                 # your OpenRouter key (stored locally)
pagelathe init my-landing && cd my-landing
pagelathe generate -d "A Postgres branching service for teams"
pnpm install && pnpm dev                 # http://localhost:4321
```

`generate` classifies your product, plans the sections, and fills on-brand copy and code — all
bounded by each section's schema, so output is always valid. Edit the generated
`src/content/landing/index.yaml` or any `src/components/sections/*` to make it yours. Scaffolded
projects build standalone — no monorepo required.

## Commands

| Command                          | What it does                                                        |
| -------------------------------- | ------------------------------------------------------------------- |
| `pagelathe config set-key [key]` | Store your OpenRouter API key locally (prompts if omitted)          |
| `pagelathe config show`          | Show current config (key is masked)                                 |
| `pagelathe init [dir]`           | Scaffold a new pagelathe landing project (`-f, --force`)            |
| `pagelathe generate`            | Generate an on-brand landing page from a product description        |
| `pagelathe add <section>`        | Vendor a section component from the registry into your project      |
| `pagelathe --version`            | Print the installed version                                         |

### `generate` options

- `-d, --description <text>` — product description (skips the interactive prompt)
- `-m, --model <id>` — OpenRouter model id (defaults to your config, `anthropic/claude-3.7-sonnet`)

Run any command with `--help` for full usage.

## Your API key

pagelathe is local-first: you bring your own [OpenRouter](https://openrouter.ai) key. It is
stored only on your machine — at `~/.pagelathe/config.json` (mode `0600`) or via the
`OPENROUTER_API_KEY` environment variable — and sent only to OpenRouter. It is never logged,
printed in full, or transmitted anywhere else. See
[SECURITY.md](https://github.com/gasci/pagelathe/blob/master/SECURITY.md).

## Status

🚧 **Early and moving fast.** Generation (`pagelathe generate`) is live; the observational
**optimize loop** (measure → suggest section reorderings from real analytics) is on the
[roadmap](https://github.com/gasci/pagelathe/blob/master/ROADMAP.md).

## Links

- 📖 [Documentation & full design](https://github.com/gasci/pagelathe)
- 🐛 [Report an issue](https://github.com/gasci/pagelathe/issues)
- 🤝 [Contributing](https://github.com/gasci/pagelathe/blob/master/CONTRIBUTING.md) — authoring
  landing-page sections is the highest-impact contribution

## License

[Apache-2.0](https://github.com/gasci/pagelathe/blob/master/LICENSE). "pagelathe" is a project
trademark — see [TRADEMARK.md](https://github.com/gasci/pagelathe/blob/master/TRADEMARK.md).
