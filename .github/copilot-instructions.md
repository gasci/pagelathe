# GitHub Copilot instructions for pagelathe

Full guidance: see [AGENTS.md](../AGENTS.md). Summary:

- **Stack:** pnpm 9 · Node ≥20.11 · TypeScript ESM (NodeNext) · commander · zod · vitest · tsup.
- **Imports:** relative TS imports use `.js` extensions; type-only imports use `import type`.
- **Tests:** TDD — write the failing test first; tests in `packages/*/test/`. Run
  `pnpm --filter pagelathe test`.
- **Commits:** Conventional Commits, signed off (`git commit -s`). Changeset for published changes.
- **Security:** never hardcode or log API keys; the OpenRouter key stays local and is sent only
  to OpenRouter.
- **Style:** small focused files, ESM, match existing patterns. Run `pnpm lint && pnpm format:check`
  before committing.
