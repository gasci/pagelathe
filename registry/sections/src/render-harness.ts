import { experimental_AstroContainer as AstroContainer } from "astro/container";
import type { AstroComponentFactory } from "astro/runtime/server/index.js";

/** Render a section component to an HTML string with the given props. */
export async function renderToHtml(
  Component: AstroComponentFactory,
  props: Record<string, unknown>,
): Promise<string> {
  const container = await AstroContainer.create();
  return container.renderToString(Component, { props });
}
