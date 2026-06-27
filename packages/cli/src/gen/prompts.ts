export const BANNED_WORDS = [
  "scalable",
  "powerful",
  "easy",
  "seamless",
  "robust",
  "cutting-edge",
  "revolutionary",
  "game-changing",
];

export const BRAND_RULES = `You write landing-page copy for technical founders building developer tools.
Rules (non-negotiable):
- Anti-fluff: never use these words: ${BANNED_WORDS.join(", ")}. Be concrete and specific.
- Dark-mode-first, terse, honest. No marketing hyperbole.
- Keep terminology consistent across sections (same product nouns and verbs).
- For sdk-infra/technical-app products, lead with real code and real numbers.
- Pricing must be honest: name real constraints (rate limits, free tier, OSS).`;

export const archetypeSystem = `You classify developer-product landing pages into one archetype.
${BRAND_RULES}`;

export const plannerSystem = `You plan the section order of a developer landing page.
${BRAND_RULES}`;

export const metaSystem = `You write page metadata (title, description) for a developer landing page.
${BRAND_RULES}`;

export function fillSystem(type: string, archetype: string): string {
  return `You write the content for the "${type}" section of a ${archetype} developer landing page.
${BRAND_RULES}
Fill every required field of the JSON schema with concrete, on-brand content.`;
}

export function editSystem(type: string, archetype: string): string {
  return `You revise the "${type}" section of a ${archetype} developer landing page.
${BRAND_RULES}
You are given the section's current props and an edit instruction. Apply ONLY the requested change
and keep every other field exactly as given. Preserving unchanged fields verbatim takes priority
over the style rules above — apply the banned-words rule only to text you newly write or change for
this instruction; do NOT rewrite untouched fields to remove pre-existing banned words. Return the
COMPLETE props object, including every field that was already set.`;
}
