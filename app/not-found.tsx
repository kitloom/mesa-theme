import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Shell } from '@/components/Shell'
import { SearchForm } from '@/components/HeaderTools'
import { getPage } from '@/lib/page'

/**
 * The site's 404, in the site's frame: the boundary gets no route params, so the address comes
 * from the proxy's header, and the page the site answered for it — menus and all — from the cache.
 */
async function load() {
  const path = (await headers()).get('x-theme-path') ?? '/'
  return { path, page: await getPage(path) }
}

export async function generateMetadata(): Promise<Metadata> {
  const { page } = await load()
  return { title: page?.head?.title ?? `Page not found${page?.site?.name ? ` - ${page.site.name}` : ''}` }
}

export default async function NotFound() {
  const { path, page } = await load()

  const body = (
    <div className="container section lost">
      <svg className="lost-art" viewBox="0 0 240 120" aria-hidden="true">
        <circle cx="168" cy="44" r="22" fill="var(--sun)" />
        <path d="M0 96c40-26 80-26 120-6s80 18 120-8v38H0z" fill="var(--accent)" opacity="0.85" />
        <path d="M0 108c48-16 92-12 136 0s76 6 104-8v20H0z" fill="var(--bg-deep)" />
        <path d="M64 92V62m0 10h-8v-8m8 14h8v-10" stroke="var(--sage)" strokeWidth="5" strokeLinecap="round" fill="none" />
      </svg>
      <p className="eyebrow">404</p>
      <h1>Only sand out here.</h1>
      <p className="lede">There is no page at this address. Try a search, or head back to the start.</p>
      <div className="lost-search"><SearchForm /></div>
      <Link href="/" className="button ghost">Home</Link>
    </div>
  )

  return page ? <Shell page={page} path={path}>{body}</Shell> : body
}
