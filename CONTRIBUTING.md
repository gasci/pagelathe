# Contributing to pagelathe

Thanks for helping build the landing-page builder that knows how dev tools convert. 🛠️

## Prerequisites

- Node.js ≥ 20.11 (`.nvmrc` pins 22) and pnpm 9 (`corepack enable`).
- Run `pnpm install` at the repo root.

## Dev loop

```bash
pnpm install
pnpm --filter pagelathe test       # run CLI unit tests
pnpm --filter pagelathe build      # build the CLI
pnpm lint && pnpm format:check     # match CI
```

## Before you open a PR

1. Branch from `main`: `git switch -c feat/<short-name>`.
2. Write a failing test first, then the implementation (we practice TDD).
3. Keep commits small and use [Conventional Commits](https://www.conventionalcommits.org/)
   (`feat:`, `fix:`, `docs:`, `chore:`, `ci:`, `test:`).
4. **Sign off every commit** for the DCO: `git commit -s`.
5. Add a changeset if your change affects published behavior: `pnpm changeset`.
6. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` all pass.

## Developer Certificate of Origin (DCO)

By signing off (`Signed-off-by: Name <email>`, added automatically by `git commit -s`)
you certify the [DCO](https://developercertificate.org/). We do **not** require a CLA.

## Contributing a section

Adding a landing-page section is the most valuable contribution. Follow the step-by-step
guide: **[Adding a section](./docs/contributing/adding-a-section.md)** (~20 minutes — copy a
section, edit one schema + one component, register, test). To propose a section before
building it, open a **Section request** issue.

## Code of Conduct

This project follows the [Contributor Covenant](./CODE_OF_CONDUCT.md). Be excellent to
each other.
