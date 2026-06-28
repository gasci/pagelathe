---
"pagelathe": minor
---

Add section inspection & management commands: `pagelathe list` (sections + their content
children), `pagelathe show [sectionId]` (pretty-print the whole page or one section, `--json`
supported), and `pagelathe remove <sectionId>`. `pagelathe add <type>` now also appends the
section to `index.yaml` with default props and a fresh id (`--before`/`--after` for placement),
instead of only vendoring the component file — run `pagelathe edit <id>` to fill it on-brand.
