# pagelathe

> AI landing-page builder for technical founders. Bring your key, describe your product, and
> ship a fast, on-brand **static Astro** landing page in minutes — then let pagelathe measure
> it and tell you how to reorder sections to convert better.

[![npm version](https://img.shields.io/npm/v/pagelathe.svg)](https://www.npmjs.com/package/pagelathe)
[![CI](https://github.com/gasci/pagelathe/actions/workflows/ci.yml/badge.svg)](https://github.com/gasci/pagelathe/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/gasci/pagelathe/blob/main/LICENSE)
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
mkdir my-landing && cd my-landing            # generate scaffolds the project for you
pagelathe generate -d "A TypeScript SDK for sending transactional email"
pnpm install && pnpm dev                     # http://localhost:4321
```

> Prefer OpenRouter or OpenAI? Drop the first two lines (OpenRouter is the default) or swap
> `gemini` for `openai`. See [Providers & API keys](#providers--api-keys) for all three.

A run streams a **live token counter** as it works and prints a **prompt / completion / total**
summary at the end, so you always know what it cost:

```text
$ pagelathe generate -d "A TypeScript SDK for sending transactional email"
  Classifying product…
  ↳ 1,318 tokens used so far
  Archetype: sdk
  Planning sections…
  ↳ 4,011 tokens used so far
  Writing hero…
  ↳ 6,729 tokens used so far
  Writing features…
  ↳ 9,540 tokens used so far
  Writing codeDemo…
  ↳ 12,716 tokens used so far
  Writing pricing…
  ↳ 15,402 tokens used so far
  Writing footer…
  ↳ 17,884 tokens used so far

✓ Generated 5 sections → src/content/landing/index.yaml
  17,884 tokens used (prompt 12,090 / completion 5,794)
  Next: pnpm install && pnpm dev
```

`generate` classifies your product, plans the sections, and fills on-brand copy and code — all
bounded by each section's schema, so output is always valid. In an empty folder it **scaffolds a
runnable Astro project first** (no separate `pagelathe init` needed); in an existing project it
just updates the content. Edit the generated `src/content/landing/index.yaml` or any
`src/components/sections/*` to make it yours. Scaffolded projects build standalone — no monorepo
required.

## Example prompts

`generate` is tuned for **developer tools** — SDKs, CLIs, APIs, and dev platforms. Not sure how to
phrase yours? Borrow one of these and make it specific:

```bash
pagelathe generate -d "A TypeScript SDK for sending transactional email"
pagelathe generate -d "A CLI that turns OpenAPI specs into typed API clients"
pagelathe generate -d "An open-source feature-flag service for React and Node"
pagelathe generate -d "A self-hostable error-tracking platform for backend teams"
pagelathe generate -d "An edge-deployed image-optimization API with a generous free tier"
```

The more concrete the description — who it's for, the one job it does, what's free — the sharper
the generated copy and code samples.

## What you get

`generate` writes a standalone Astro project you fully own — no monorepo, no lock-in:

```text
my-landing/
├─ src/
│  ├─ content/landing/index.yaml      # copy, section order, which sections appear
│  └─ components/sections/*.astro     # the section components — yours to edit
├─ astro.config.mjs
└─ package.json
```

```bash
pnpm install
pnpm dev      # live preview at http://localhost:4321
pnpm build    # static site → dist/  (deploy to Vercel, Netlify, GitHub Pages, S3 — anywhere)
```

Every generated page ships **light and dark mode** out of the box. It defaults to the visitor's
system preference (`prefers-color-scheme`) and adds a persisted toggle (bottom-right) that
switches instantly — with an inline script that applies the saved choice before first paint, so
there's no flash of the wrong theme. Section colors come from a small set of semantic CSS tokens
in `src/styles/global.css` (`--color-bg`, `--color-fg`, `--color-muted`, `--color-border`,
`--color-surface`, `--color-primary`), so you can re-skin both themes in one place, and code
snippets follow the active theme via Shiki dual themes.

## Commands

| Command                           | What it does                                                            |
| --------------------------------- | ----------------------------------------------------------------------- |
| `pagelathe config set-key [key]`  | Store an API key for a provider (`-p <provider>`, prompts if omitted)   |
| `pagelathe config use <provider>` | Set the active provider: `openrouter`, `gemini`, or `openai`            |
| `pagelathe config set-model <id>` | Set the default model for a provider (`-p <provider>`)                  |
| `pagelathe config show`           | Show providers, keys (masked), and default models                       |
| `pagelathe init [dir]`            | Scaffold a new pagelathe landing project (`-f, --force`)                |
| `pagelathe generate`              | Generate an on-brand landing page from a product description            |
| `pagelathe add <section>`         | Add a section: vendor its component (if needed) + append it to the page |
| `pagelathe list`                  | List the project's sections and their content children                  |
| `pagelathe show [sectionId]`      | Pretty-print the generated content (whole page or one section)          |
| `pagelathe remove <sectionId>`    | Remove a section from the page                                          |
| `pagelathe edit <id> -i "…"`      | Revise one section from a prompt (LLM, schema-bounded)                  |
| `pagelathe --version`             | Print the installed version                                             |

### `generate` options

- `-d, --description <text>` — product description (skips the interactive prompt)
- `-p, --provider <name>` — `openrouter` (default), `gemini`, or `openai` — overrides the active provider for this run
- `-m, --model <id>` — model id (defaults to the active provider's configured model)
- `--max-tokens <n>` — pause and ask before a run exceeds this many tokens (default `100000`; `0` disables). Non-interactive runs stop safely at the cap and write nothing.

> 💸 Every `generate` run prints a **live token count** while it works and a final **prompt /
> completion / total** summary, so you always know what it cost — and `--max-tokens` keeps a
> runaway run in check.

Run any command with `--help` for full usage.

## Tweak your page

Iterate with prompts and commands after the first `generate`:

```bash
# Re-prompt: regenerate from a sharper description (overwrites index.yaml + section content)
pagelathe generate -d "A TypeScript SDK for sending transactional email — lead with the 3-line install"
pagelathe generate                         # run with no -d to be prompted interactively

# Different voice: regenerate with another provider (uses that provider's default model)
pagelathe generate --provider gemini -d "A TypeScript SDK for sending transactional email"

# Add a section: vendors the component (if absent) and appends it to the page
pagelathe add codeDemo
```

### Inspect & manage sections

```bash
pagelathe list                 # every section, in order, with its content children
pagelathe show                 # pretty-print the whole page's copy + props
pagelathe show hero-1          # …or just one section
pagelathe add pricing --before footer-1   # insert a pricing section (default props)
pagelathe edit pricing-1 -i "3 tiers: free, pro, enterprise"   # then fill it
pagelathe remove pricing-1     # remove a section by id
```

`list` and `show` are read-only and need no API key. `add` inserts a section with placeholder
defaults (offline) — run `edit` to fill it on-brand. `remove` won't delete the last section, and
leaves the vendored component file in place.

For surgical, prompt-free edits, change the generated files directly — output stays valid because
every section is schema-bounded:

- `src/content/landing/index.yaml` — copy, section order, and which sections appear
- `src/components/sections/*.astro` — markup and styling

Or revise a single section with a prompt — surgical, schema-bounded, the rest of the page untouched:

```bash
pagelathe edit hero-1 -i "make the headline punchier and lead with the 3-line install"
pagelathe edit hero-1 -i "tighten the subhead; mention the free tier"
pagelathe edit hero-1                       # no -i: prompt for the instruction
```

`edit` re-fills only that section through the model, bounded by the section's schema, then prints a
before→after diff and the tokens used. Schema defaults are stripped for the edit so the model must
echo every field it was given — preventing silent resets. (To add or remove sections, use
`generate` or hand-edit `index.yaml`.)

> ⚠️ Re-running `generate` regenerates the **whole** page and overwrites `index.yaml`, so commit
> any hand-edits you want to keep first.

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
pagelathe generate -d "A TypeScript SDK for sending transactional email"

# …or override per run without changing your default
pagelathe generate --provider openai -m gpt-5.5 -d "A TypeScript SDK for sending transactional email"
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

pagelathe is **free and open source** (MIT), built in the open at
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

[MIT](https://github.com/gasci/pagelathe/blob/main/LICENSE). "pagelathe" is a project
trademark — see [TRADEMARK.md](https://github.com/gasci/pagelathe/blob/main/TRADEMARK.md).
