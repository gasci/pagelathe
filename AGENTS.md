# AGENTS.md — AI agent & contributor guide for pagelathe

This is the **single source of truth** for how AI coding agents (and humans) work in this
repo. Tool-specific files (`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`,
`.cursor/rules/*`, `.windsurfrules`, `SKILL.md`) intentionally defer to this file — edit
guidance **here**, not there.

## What pagelathe is

A local-first CLI that generates fast, on-brand **static Astro** landing pages for technical
founders. Users bring an OpenRouter API key (Claude/Gemini by default), describe their product,
and get a customizable, section-based Astro project they fully own — plus an observational
"optimize" loop that suggests section reorderings from real analytics. Full design in
`docs/superpowers/specs/`.

## Repository layout

- `packages/cli/` — the published `pagelathe` CLI (TypeScript, ESM).
- `registry/` — section components + app engine scaffolded into users' projects (_arrives in M2_).
- `docs/` — docs site + design specs and implementation plans under `docs/superpowers/`.
- `.github/` — CI/CD workflows, issue/PR templates, CODEOWNERS.

## Tech stack

Node ≥20.11 · pnpm 9 · TypeScript 5.9 (ESM, NodeNext) · commander · @clack/prompts · zod ·
vitest · tsup · eslint (flat) + prettier · Changesets · GitHub Actions.

## Golden-path commands

```bash
pnpm install                      # install all workspaces
pnpm --filter pagelathe test      # run CLI unit tests (vitest)
pnpm --filter pagelathe build     # build the CLI (tsup → dist)
pnpm lint                         # eslint
pnpm typecheck                    # tsc --noEmit across workspaces
pnpm format                       # prettier --write
pnpm format:check                 # prettier --check (what CI runs)
```

## Conventions (follow exactly)

- **ESM only.** `"type": "module"`. In TS source, relative imports MUST use `.js` extensions
  (NodeNext), e.g. `import { x } from "./foo.js"`. Use `import type` for type-only imports
  (`verbatimModuleSyntax` is on).
- **TDD.** Write a failing test first, watch it fail, implement the minimum to pass, refactor.
  Tests live in `packages/<pkg>/test/`.
- **Conventional Commits** + **DCO sign-off**: `git commit -s -m "feat: ..."`
  (`feat`/`fix`/`docs`/`chore`/`ci`/`test`). Every commit needs a `Signed-off-by` trailer.
- **Changesets** for any change to published behavior: `pnpm changeset`.
- **Small, focused files**, one responsibility each. Match existing patterns.
- **Never** commit secrets. The user's OpenRouter key is stored locally
  (`~/.pagelathe/config.json`, mode 0600) or via `OPENROUTER_API_KEY`; it is sent only to
  OpenRouter and never logged or printed in full. `.env*` and `.pagelathe/` are git-ignored.

## Before opening a PR

`pnpm install && pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`
must all pass (mirrors CI). Add a changeset if you changed published behavior. Sign off commits.

## Where to look

- Design spec: `docs/superpowers/specs/2026-06-23-pagelathe-design.md`
- Implementation plans: `docs/superpowers/plans/`
- Contributing: `CONTRIBUTING.md` · Security/keys: `SECURITY.md` · Roadmap: `ROADMAP.md`

## Do / Don't

- ✅ Keep generation output bounded by section schemas; prefer static Astro output; keep the CLI
  dependency-light.
- ❌ Don't introduce a backend or send user keys anywhere but OpenRouter; don't add a UI
  framework to the generated site without a design decision; don't bypass TDD or skip DCO sign-off.
