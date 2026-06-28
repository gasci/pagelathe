---
"pagelathe": patch
---

Fix an inaccurate `edit` example in the bundled `SKILL.md`. Section ids are `<type>-1` (e.g.
`hero-1`), so the example now reads `pagelathe edit hero-1 -i "…"` instead of `pagelathe edit
hero`, with a note clarifying that `edit` takes a section **id** while `add` takes the bare type.
