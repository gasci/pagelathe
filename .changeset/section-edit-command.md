---
"pagelathe": minor
---

Add `pagelathe edit <sectionId> --set <path>=<value>` — deterministic, no-LLM editing of a single
section's fields in `index.yaml`. Supports nested and array paths (`ctas.0.label`), coerces values
using the section's schema, and re-validates before an atomic write so the rest of the page is
untouched. Run `pagelathe edit <sectionId>` with no `--set` to inspect a section's fields.
