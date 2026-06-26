---
"pagelathe": minor
---

`generate` now scaffolds a runnable Astro project automatically when run in a folder that isn't
one yet — so `pagelathe generate -d "…"` followed by `pnpm install && pnpm dev` works without a
separate `pagelathe init`. Run inside an existing project (a `package.json` is present) and it
leaves the scaffold untouched and only updates the generated content. `init` remains available
for explicitly scaffolding an empty named directory.
