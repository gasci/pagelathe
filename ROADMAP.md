# Roadmap

pagelathe ships in milestones. Each is a self-contained, testable release.

- **M1 — Foundation & Governance** _(in progress)_: monorepo, CI/CD, governance, CLI shell
  with config + OpenRouter key vault.
- **M2 — App engine & section registry**: `pagelathe init` scaffolds a building static Astro
  site; shadcn-style section registry with core sections; `add` / `update`.
- **M3 — Generation engine**: `pagelathe generate` — describe your product → archetype →
  section plan → schema-constrained content via OpenRouter (Claude/Gemini by default).
- **M4 — Optimize loop**: analytics instrumentation + PostHog adapter + `pagelathe optimize`
  AI-suggested section reordering.

**Later:** reference input (screenshot / URL scrape → generate), live A/B experiments, a local
web editor, more analytics + native LLM adapters, more section packs.

Have an idea? Open a Feature request or Discussion.
