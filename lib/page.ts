import { cache } from 'react'
import { siteFetch } from './site'
import type { Page, Shortcode } from './types'

/**
 * The page at an address, read from the site once per request: `generateMetadata`, the page and
 * the not-found boundary of one request share it.
 */
export const getPage = cache(async (path: string): Promise<Page | null> => {
  const { data } = await siteFetch<Page>(path)
  return data && typeof data === 'object' && 'kind' in data ? data : null
})

/** The site's address from the route: the catch-all's segments, the trailing slash, the query. */
export function pathOf(slug: string[] | undefined, query: Record<string, string | string[] | undefined>): string {
  const segments = (slug ?? []).map(segment => encodeURIComponent(segment))
  const path = segments.length ? `/${segments.join('/')}/` : '/'
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    for (const one of Array.isArray(value) ? value : value === undefined ? [] : [value]) search.append(key, one)
  }
  const tail = search.toString()
  return tail ? `${path}?${tail}` : path
}

/** The shortcode of that name on the page, if the owner put one there. */
export function shortcode<T = Shortcode>(page: Page, name: string): T | null {
  const shortcodes = page.shortcodes
  if (!shortcodes || Array.isArray(shortcodes)) return null
  return (Object.values(shortcodes).find(s => s.shortcode === name) as T | undefined) ?? null
}
