---
name: pagelathe-dev
description: Use when developing in the pagelathe repository — building or changing the CLI, adding sections, or contributing — to follow the project's TDD, ESM, commit, and key-safety conventions.
---

# Developing pagelathe

pagelathe is a local-first CLI that generates static Astro landing pages for technical founders.
This skill captures the repo's development workflow. The full passive guide is in `AGENTS.md`.

## Workflow

1. **Understand the task** against the design spec (`docs/superpowers/specs/`) and the milestone
   plans (`docs/superpowers/plans/`).
2. **TDD.** Write a failing test in `packages/<pkg>/test/` first; run it and watch it fail;
   implement the minimum to pass; refactor.
3. **Build & verify:** `pnpm --filter pagelathe test`, then `pnpm lint && pnpm typecheck && pnpm build`.
4. **Commit** in small steps with Conventional Commits + DCO sign-off: `git commit -s -m "feat: ..."`.
5. **Changeset** if you changed published behavior: `pnpm changeset`.

## Rules that are easy to get wrong

- ESM + NodeNext: relative imports MUST use `.js` extensions; type-only imports use `import type`.
- Never commit, log, or transmit the user's OpenRouter key anywhere but OpenRouter.
- Keep files small and single-responsibility; match existing patterns.

## Adding a landing-page section

The section registry lands in milestone M2. Until then, propose sections via a **Section
request** issue. Once the registry exists, each section ships a component, a Zod schema, a
preview, and an a11y-passing test — see the registry's contribution guide (M2).
