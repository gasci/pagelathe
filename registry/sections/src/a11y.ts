export interface A11yExpectations {
  /** Require at least one landmark element from this list (e.g. ["nav"]). */
  landmarks?: string[];
  /** Every <img> must have a non-empty alt attribute. */
  imagesHaveAlt?: boolean;
  /** Every <a> must have non-whitespace text or an aria-label. */
  linksHaveText?: boolean;
}

/** Lightweight, dependency-free structural a11y assertions over rendered HTML.
 *  Returns an array of human-readable violation messages (empty == pass). */
export function checkA11y(html: string, expect: A11yExpectations): string[] {
  const violations: string[] = [];
  for (const tag of expect.landmarks ?? []) {
    if (!new RegExp(`<${tag}[\\s>]`, "i").test(html)) {
      violations.push(`missing <${tag}> landmark`);
    }
  }
  if (expect.imagesHaveAlt) {
    for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
      if (!/\balt\s*=\s*["'][^"']+["']/i.test(img)) violations.push(`<img> without alt: ${img}`);
    }
  }
  if (expect.linksHaveText) {
    for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const attrs = m[1] ?? "";
      const inner = (m[2] ?? "").replace(/<[^>]+>/g, "").trim();
      if (inner.length === 0 && !/\baria-label\s*=/i.test(attrs)) {
        violations.push(`<a> without text or aria-label`);
      }
    }
  }
  return violations;
}
