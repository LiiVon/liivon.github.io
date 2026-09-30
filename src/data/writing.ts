import { getCollection, type CollectionEntry } from 'astro:content'

/* ==========================================================================
   Writing data access - the ONLY place that knows how an article is stored.

   Home ("Latest writing"), the Blog archive and every article page all read
   from here, so there is exactly one source of truth: src/content/blog/*.md
   ========================================================================== */

export type BlogEntry = CollectionEntry<'blog'>
export type SeriesEntry = CollectionEntry<'series'>

export interface Writing {
  /** File-derived URL segment. Serves /blog/<slug>. */
  slug: string
  title: string
  description: string
  /** Pre-formatted as YYYY.MM.DD so every row can use tabular-nums. */
  date: string
  category: string
  tags: string[]
  readingTime: string
  href?: string
  /** Present when the post belongs to a project folder. */
  series?: string
  /** Authoring order within the series (undefined → sorted by date). */
  seriesOrder?: number
}

/** A project folder plus the posts that belong to it, in reading order. */
export interface SeriesMeta {
  slug: string
  title: string
  description: string
  order: number
  posts: Writing[]
}

/** UTC, so a post never drifts a day depending on who builds the site. */
export function formatDate(value: Date): string {
  const year = value.getUTCFullYear()
  const month = String(value.getUTCMonth() + 1).padStart(2, '0')
  const day = String(value.getUTCDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

/**
 * Published entries, newest first. Drafts show in dev, hide in production.
 * The ordering defined here drives every listing AND the Previous / Next
 * links on an article page.
 */
export async function publishedPosts(): Promise<BlogEntry[]> {
  const entries = await getCollection('blog', ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  )

  return entries.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())
}

/** Flat view-model used by lists (Home, Blog). */
export async function allWriting(): Promise<Writing[]> {
  return (await publishedPosts()).map((entry) => ({
    slug: entry.slug,
    title: entry.data.title,
    description: entry.data.description,
    date: formatDate(entry.data.date),
    category: entry.data.category,
    tags: entry.data.tags,
    readingTime: entry.data.readingTime,
    href: `/blog/${entry.slug}`,
    series: entry.data.series,
    seriesOrder: entry.data.seriesOrder,
  }))
}

/** Home needs only a few. Assumes the newest-first order from allWriting(). */
export async function latestWriting(count = 3): Promise<Writing[]> {
  return (await allWriting()).slice(0, count)
}

/** Within a series: explicit seriesOrder first, then date as tie-breaker. */
function partCompare(a: Writing, b: Writing): number {
  const ao = a.seriesOrder ?? Number.MAX_SAFE_INTEGER
  const bo = b.seriesOrder ?? Number.MAX_SAFE_INTEGER
  if (ao !== bo) return ao - bo
  return a.date.localeCompare(b.date)
}

/** Posts in one series, reading order (seriesOrder, then date). */
export async function postsInSeries(slug: string): Promise<Writing[]> {
  const posts = (await allWriting()).filter((p) => p.series === slug)
  return posts.sort(partCompare)
}

/**
 * Every series that currently has at least one published post, ordered by
 * `order` then title. Each carries its posts in reading order.
 */
export async function seriesList(): Promise<SeriesMeta[]> {
  const [seriesEntries, posts] = await Promise.all([
    getCollection('series'),
    allWriting(),
  ])

  const bySeries = new Map<string, Writing[]>()
  for (const p of posts) {
    if (!p.series) continue
    const arr = bySeries.get(p.series) ?? []
    arr.push(p)
    bySeries.set(p.series, arr)
  }

  return seriesEntries
    .filter((s) => bySeries.has(s.slug))
    .map((s) => {
      const sp = bySeries.get(s.slug)!
      sp.sort(partCompare)
      return {
        slug: s.slug,
        title: s.data.title,
        description: s.data.description,
        order: s.data.order,
        posts: sp,
      }
    })
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title))
}

/**
 * Grouped view-model for /blog: series blocks (with metadata + posts) plus a
 * standalone block of posts that opt out of any series ("Notes").
 */
export async function groupBySeries(): Promise<{
  series: SeriesMeta[]
  standalone: Writing[]
}> {
  const [series, posts] = await Promise.all([seriesList(), allWriting()])
  const inSeries = new Set(series.flatMap((s) => s.posts.map((p) => p.slug)))
  const standalone = posts.filter((p) => !inSeries.has(p.slug))
  return { series, standalone }
}
