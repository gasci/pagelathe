# pagelathe

## 0.1.1

### Patch Changes

- Add an npm README documenting install, the CLI commands, key handling, and project status so the package page is self-explanatory.

## 0.1.0

### Minor Changes

- 9f0e2b9: Initial CLI foundation: `pagelathe config set-key` / `config show` with a local,
  env-overridable OpenRouter key vault.
- d29a2dc: Add the app engine and section registry: `pagelathe init` scaffolds a buildable
  static Astro + Tailwind v4 landing project with the required-section set, and
  `pagelathe add <section>` vendors additional sections from the registry.
- 9510701: Add `pagelathe generate`: describe your product and get an on-brand landing
  page. The engine classifies the archetype, plans sections, and fills each
  section's content via OpenRouter — bounded by the section schemas so output is
  always valid — then writes `index.yaml` and vendors the chosen sections.
  Scaffolded projects are now standalone-installable.
