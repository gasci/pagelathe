import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { pageDocumentSchema } from "./content/_schema.js";

const landing = defineCollection({
  loader: glob({ pattern: "**/*.yaml", base: "./src/content/landing" }),
  schema: pageDocumentSchema,
});

export const collections = { landing };
