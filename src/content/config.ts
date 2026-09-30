import { defineCollection, z } from 'astro:content'

/* ==========================================================================
   Content layer — the single source of truth for everything written.

   Rules that keep this maintainable long term:
   - UI code NEVER hard-codes an article. It queries getCollection().
   - The slug comes from the file name, so renaming a file renames its URL.
   - Adding a file under src/content/blog/ updates Home and Blog at once.
   ========================================================================== */

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    /** One sentence. Used by the Blog list row and later by SEO/OG tags. */
    description: z.string(),
    /** Rendered as YYYY.MM.DD and used as the sort key. */
    date: z.coerce.date(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    /** Authored by hand for now — it is editorial copy, not a computed value. */
    readingTime: z.string(),
    /** Drafts are visible in dev, hidden in production builds. */
    draft: z.boolean().default(false),
    /** Optional project folder. Posts sharing a series slug are grouped on
        /blog and get a /blog/series/[slug] landing page. Omit for one-offs. */
    series: z.string().optional(),
    /** Position within the series; falls back to `date` when omitted. */
    seriesOrder: z.number().optional(),
  }),
})

/** Project folders. One markdown file per series, holding its title + blurb
    used by the /blog grouping and the series landing page. */
const series = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    /** Orders the series blocks on /blog and within the series list. */
    order: z.number().default(0),
  }),
})

export const collections = { blog, series }
