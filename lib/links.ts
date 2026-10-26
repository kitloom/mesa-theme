import { SITE_URL } from './config'

/**
 * Every link the site sends is absolute — to the site. The theme serves the same paths, so an
 * address of the site becomes a path of the theme, and the rest stays as it is.
 */
export function isInternal(url: string | null | undefined): boolean {
  return !!url && (url.startsWith(SITE_URL) || (url.startsWith('/') && !url.startsWith('//')))
}

export function toPath(url: string | null | undefined): string {
  if (!url) return '/'
  if (url.startsWith(SITE_URL)) return url.slice(SITE_URL.length) || '/'
  return url
}

/** Words from the admin carry the site's addresses in their hrefs; the theme's are shorter. */
export function rewrite(html: string | null | undefined): string {
  return (html ?? '').split(`href="${SITE_URL}`).join('href="')
}
