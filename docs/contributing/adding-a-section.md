# How to contribute a section

Sections are the heart of pagelathe and **the most valuable contribution you can make**.
A section is a self-contained landing-page block (hero, pricing, FAQ, …) defined by **one
Zod schema** plus **one Astro component**. The schema is the keystone: it validates page
content at build time and (soon) constrains the AI's output — so a section can never emit
off-schema or unsafe markup.

This guide gets you from zero to a merged section. It takes ~20 minutes.

## The shape of a section

Every section lives in its own folder under [`registry/sections/`](../../registry/sections):

```
registry/sections/<type>/
  schema.ts       # the Zod props schema + manifest (the contract)
  section.astro   # the component that renders those props
```

`<type>` is the section's id and must equal the folder name (e.g. `pricing`).

## Step 1 — Copy an existing section

The fastest start is to copy one that's close to what you want. `finalCta` is the simplest;
`pricing` or `features` are good for list-driven sections.

```bash
cp -r registry/sections/finalCta registry/sections/<type>
```

## Step 2 — Define the schema (`schema.ts`)

Export exactly three names. The CLI and the app both rely on them.

```ts
import { z } from "zod";
import type { SectionManifest } from "../src/manifest.js";

// 1. The props the component renders. Keep fields bounded and honest.
export const propsSchema = z.object({
  heading: z.string().min(1),
  items: z.array(z.string().min(1)).min(1).max(8),
});

// 2. The page-document entry: pins the type literal + an id + the props.
export const entrySchema = z.object({
  type: z.literal("<type>"),
  id: z.string().min(1),
  props: propsSchema,
});

// 3. The manifest: metadata + sample defaults (MUST validate against propsSchema).
export const manifest: SectionManifest = {
  type: "<type>",
  title: "My Section",
  description: "One line on what this section is for.",
  required: false,
  archetypes: ["sdk-infra", "technical-app", "general"],
  componentFile: "section.astro",
  defaultProps: {
    heading: "Example heading",
    items: ["First", "Second"],
  } satisfies z.input<typeof propsSchema>,
};
```

> `SectionType` in [`registry/sections/src/manifest.ts`](../../registry/sections/src/manifest.ts)
> is a closed union — add your `<type>` there too.

## Step 3 — Build the component (`section.astro`)

Render **only** from props. The rules that keep pagelathe fast, safe, and on-brand:

- **Dark-mode-first.** Use the design tokens: `var(--color-primary)`, `var(--radius)`.
- **No raw HTML injection.** Interpolate with `{value}` (Astro auto-escapes). The _only_
  place `set:html` is allowed is shiki's highlighted-code output (see `codeDemo`).
- **Accessibility.** Use real landmarks (`<nav>`, `<footer>`…), give every `<img>` an `alt`,
  and make every link/button carry text or an `aria-label`.
- **Anti-fluff copy** in any built-in text — avoid "scalable / powerful / easy".
- **Static.** No UI framework. A tiny vanilla `<script>` is fine for things like tabs.

```astro
---
import type { z } from "zod";
import type { propsSchema } from "./schema.js";

type Props = z.infer<typeof propsSchema>;
const { heading, items } = Astro.props as Props;
---

<section class="mx-auto max-w-6xl px-6 py-24" data-section="<type>">
  <h2 class="text-3xl font-bold tracking-tight text-white">{heading}</h2>
  <ul class="mt-6 space-y-2">
    {items.map((item) => <li class="text-white/70">{item}</li>)}
  </ul>
</section>
```

## Step 4 — Register it

Add your module to the registry index
[`registry/sections/src/registry.ts`](../../registry/sections/src/registry.ts) — one import
and one array entry (this is the single place sections are enumerated). Once registered, your
section is automatically AI-selectable: `pagelathe generate` adds it to the planner's
available set and the fill stage uses its schema to constrain the AI's output.

```ts
import * as mySection from "../<type>/schema.js";
// …
export const sectionModules: RegistryEntry[] = [
  // …existing entries…
  {
    manifest: mySection.manifest,
    propsSchema: mySection.propsSchema,
    entrySchema: mySection.entrySchema,
  },
];
```

## Step 5 — Test it

Add `registry/sections/test/<type>.test.ts`. At minimum: the schema validates its own
`defaultProps`, a constraint is enforced, and the component renders real content + passes the
basic a11y check.

```ts
import { describe, expect, it } from "vitest";
import { propsSchema, manifest } from "../<type>/schema.js";
import MySection from "../<type>/section.astro";
import { renderToHtml } from "../src/render-harness.js";
import { checkA11y } from "../src/a11y.js";

describe("<type>", () => {
  it("validates its own defaults", () => {
    expect(propsSchema.safeParse(manifest.defaultProps).success).toBe(true);
  });
  it("renders and passes basic a11y", async () => {
    const html = await renderToHtml(MySection, propsSchema.parse(manifest.defaultProps));
    expect(html).toContain("Example heading");
    expect(checkA11y(html, { linksHaveText: true, imagesHaveAlt: true })).toEqual([]);
  });
});
```

Run the suite:

```bash
pnpm --filter @pagelathe/sections test
pnpm --filter @pagelathe/sections typecheck
```

The CI **registry validation gate** also checks that every section has a `section.astro`, a
`componentFile` of `"section.astro"`, and `defaultProps` that validate — so a green local run
means a green PR.

## Step 6 — Open the PR

Sign off your commits (`git commit -s`), use a Conventional Commit
(`feat(sections): add <type> section`), and add a changeset only if you changed published CLI
behavior (a new registry section alone usually doesn't). That's it — thank you! 🛠️
