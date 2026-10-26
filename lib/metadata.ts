import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { toPath } from './links'
import type { Page } from './types'

/** The theme's own origin, as the visitor reached it. */
export async function origin(): Promise<string> {
  const incoming = await headers()
  const host = incoming.get('x-forwarded-host') ?? incoming.get('host') ?? 'localhost'
  const proto = incoming.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https')
  return `${proto}://${host}`
}

/**
 * The title, description, robots, social cards and alternates the site computed for the page —
 * its SEO module's — with every address moved onto the theme's origin.
 */
export async function metadataOf(page: Page | null): Promise<Metadata> {
  if (!page) return {}
  const base = await origin()
  const head = page.head
  const og = head?.openGraph ?? {}
  const here = (url: string | undefined) => (url ? base + toPath(url) : undefined)

  return {
    metadataBase: new URL(base),
    title: head?.title ?? page.site?.name,
    description: head?.description,
    robots: head?.robots,
    alternates: {
      canonical: here(head?.canonical),
      languages: Object.fromEntries(Object.entries(head?.alternates ?? {}).map(([lang, url]) => [lang, here(url)!])),
    },
    openGraph: {
      title: og['og:title'],
      description: og['og:description'],
      url: here(og['og:url']),
      siteName: og['og:site_name'],
      locale: og['og:locale'],
      type: og['og:type'] === 'article' ? 'article' : 'website',
      images: og['og:image'] ? [og['og:image']] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: head?.twitter?.['twitter:title'],
      description: head?.twitter?.['twitter:description'],
    },
  }
}

/** The site's JSON-LD as a script; `<` escaped so no text of a post can close the tag. */
export function jsonLd(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}
