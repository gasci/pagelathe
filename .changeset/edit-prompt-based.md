---
"pagelathe": minor
---

Replace `pagelathe edit --set <path>=<value>` with prompt-based section editing:
`pagelathe edit <sectionId> -i "<instruction>"`. The model revises only the targeted section,
bounded by that section's schema, and prints a before→after diff. To prevent silent data loss,
schema defaults are stripped for the edit call so the model must echo every previously-set field
(an omission re-prompts instead of resetting a value). It reuses `generate`'s provider/model
selection and prints the tokens used. Run `pagelathe edit <sectionId>` with no `-i` to be prompted
for the instruction.
