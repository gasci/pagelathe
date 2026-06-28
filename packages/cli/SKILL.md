---
name: pagelathe
description: Use when the user wants to create, scaffold, or generate a landing page or marketing site for a developer tool, SDK, CLI, or API — or wants to add, edit, or preview sections of an existing pagelathe Astro project. Triggers include "make me a landing page", "generate a site for my SDK", "add a pricing section", "change the hero copy", "spin up a marketing page".
---

# pagelathe — generate landing pages with the CLI

pagelathe is an installed CLI that generates a **static Astro** landing page for a developer
tool from a one-line product description, then lets you add and revise sections.

**Core principle: drive the `pagelathe` CLI — never hand-write Astro sections or hand-edit the
generated copy.** The CLI's output is bounded by per-section schemas, so generation and edits
are always valid. Reimplementing that by hand defeats the entire point and produces invalid
content. Reach for a shell command first; touch files by hand only when no command covers it.

## When to use

- "Build / generate / scaffold a landing (or marketing) page" — especially for an SDK, CLI,
  API, or dev platform.
- "Add a pricing / FAQ / hero / features section" to a generated project.
- "Change the hero headline" / "make the pricing copy punchier" — section content edits.
- "Preview / build the site I generated."

**Not for:** generic React/Next apps, blog posts (that's a different tool), or sites that aren't
developer-tool landing pages.

## Prerequisites (check first)

1. **CLI present:** `pagelathe --version`. If missing: `npm install -g pagelathe` (Node ≥20.11).
2. **A provider API key.** Three providers: `openrouter` (default), `gemini`, `openai`. The key
   is read from config (`~/.pagelathe/config.json`, mode 0600) or the matching env var
   (`OPENROUTER_API_KEY` / `GEMINI_API_KEY` or `GOOGLE_API_KEY` / `OPENAI_API_KEY`).
   - Set + select once: `pagelathe config set-key --provider gemini` then `pagelathe config use gemini`.
   - Inspect state: `pagelathe config show` (keys shown masked).

## Primary workflow — generate

```bash
mkdir my-landing && cd my-landing
pagelathe generate -d "A TypeScript SDK for sending transactional email"
pnpm install && pnpm dev        # preview at http://localhost:4321  (needs Node ≥22)
```

**`generate` auto-scaffolds an empty directory** — there is **no need to run `init` first**.
It classifies the product, plans sections, and fills schema-bounded copy + code. In an existing
project it only updates content. The sharper the description (who it's for, the one job it does,
what's free), the sharper the output.

`--max-tokens <n>` pauses for confirmation once `n` tokens are used (default 100000; `0`
disables). `-p/--provider` and `-m/--model` override the active config per run.

## Quick reference

| Goal                             | Command                                                |
| -------------------------------- | ------------------------------------------------------ |
| Generate a page (auto-scaffolds) | `pagelathe generate -d "<product description>"`        |
| Empty scaffold only, no AI       | `pagelathe init [dir]` (`--force` for a non-empty dir) |
| Vendor a section component       | `pagelathe add <section>` (`--force` to overwrite)     |
| Revise one section's content     | `pagelathe edit <sectionId> -i "<what to change>"`     |
| Manage providers / keys          | `pagelathe config set-key\|use\|set-model\|show`       |

**Section types:** `hero`, `header`, `footer`, `features`, `codeDemo`, `pricing`, `finalCta`.

## What gets produced (a standalone Astro project you own)

```text
my-landing/
├─ src/content/landing/index.yaml     # copy, section order, which sections appear
└─ src/components/sections/*.astro     # the section components — yours to edit
```

- `pnpm dev` → live preview at `http://localhost:4321`.
- `pnpm build` → static site in `dist/` (deploy anywhere: Vercel, Netlify, Pages, S3).

## Editing content the right way

To change wording, headings, or fields in a section, use `edit` — it routes the change through
an LLM **bounded by the section schema** and validates the whole document before writing
(last-good is preserved on failure):

```bash
pagelathe edit hero -i "shorten the headline and make the subheading mention the free tier"
```

`edit` writes to `src/content/landing/index.yaml`. Hand-editing that YAML is allowed for small
literal tweaks, but prefer `edit` for anything an agent would otherwise free-write — it keeps
output schema-valid. If `edit` reports an unknown section id, it lists the available ids.

## Common mistakes

| Mistake                                                    | Do instead                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Hand-writing `.astro` sections or inventing copy           | Use `generate` / `add` / `edit` — output is schema-bounded                             |
| Running `pagelathe init` before `generate` in an empty dir | Just run `generate` — it scaffolds for you                                             |
| "No key found" error                                       | `pagelathe config set-key --provider <p>` or export the env var, then `config use <p>` |
| Pasting the user's key anywhere but the provider           | Keys go only to that provider's official API — never log or echo a key in full         |
| Expecting React/Next output                                | pagelathe emits **static Astro**; the generated site needs Node ≥22 to run             |
