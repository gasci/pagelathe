---
"pagelathe": minor
---

Replace `pagelathe edit --set <path>=<value>` with prompt-based section editing:
`pagelathe edit <sectionId> -i "<instruction>"`. The model revises only the targeted section,
bounded by that section's schema, preserves unmentioned fields, and prints a before→after diff. It
reuses `generate`'s provider/model selection, live token counter, and `--max-tokens` budget guard.
Run `pagelathe edit <sectionId>` with no `-i` to be prompted for the instruction.
