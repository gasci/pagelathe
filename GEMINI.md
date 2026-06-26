# GEMINI.md

The authoritative agent guide for this repository is **[AGENTS.md](./AGENTS.md)** — read it
before making changes. This file is a pointer so guidance does not drift.

Critical rules (full version in AGENTS.md):

- pnpm 9, Node ≥20.11, TypeScript ESM (NodeNext: relative imports use `.js`, type-only imports
  use `import type`).
- TDD: failing test first. Run `pnpm --filter pagelathe test`.
- Conventional Commits + DCO sign-off (`git commit -s`). Add a changeset (`pnpm changeset`) for
  published changes.
- Never commit or transmit the user's OpenRouter key anywhere but OpenRouter.
