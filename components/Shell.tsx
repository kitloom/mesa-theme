import Link from 'next/link'
import { Suspense, type ReactNode } from 'react'
import { isInternal, toPath } from '@/lib/links'
import type { MenuItem, Page } from '@/lib/types'
import { HtmlContent } from './HtmlContent'
import { HtmlLang } from './HtmlLang'
import { MenuButton, SearchForm, ThemeToggle } from './HeaderTools'

/**
 * The header and the footer around every page, drawn from the page the site sent: the menus by
 * location, every widget zone, the languages, the cart count and whether the visitor is signed in.
 * In the page, not the layout: a layout stays from one page to the next, and these change with it.
 */
export function Shell({ page, path, children }: { page: Page; path: string; children: ReactNode }) {
  const menus = page.menus ?? {}
  const at = (location: string) => {
    const name = page.menuLocations?.[location]
    return name ? menus[name] ?? null : null
  }
  const primary = at('pantry-primary') ?? Object.values(menus)[0] ?? null
  const footerLinks = at('pantry-footer')
  const social = at('pantry-social')
  const languages = page.languages?.languages.filter(l => l.translated) ?? []
  const zones = Object.entries(page.widgets ?? {}).filter(([, widgets]) => widgets.length)
  const site = page.site
  const current = path.split('?')[0]

  return (
    <div className="site">
      <HtmlLang lang={site?.language?.slice(0, 2) ?? 'en'} />
      <header className="header">
        <div className="container bar">
          <Link href="/" className="brand">
            <svg className="brand-mark" viewBox="0 0 40 40" aria-hidden="true">
              <rect width="40" height="40" rx="8" fill="var(--dusk)" />
              <circle cx="26" cy="15" r="7" fill="var(--sun)" />
              <path d="M0 30c8-6 14-6 20-1s12 4 20-2v13H0z" fill="var(--accent)" />
              <path d="M0 35c9-4 16-3 22 0s12 1 18-2v7H0z" fill="var(--bg)" />
            </svg>
            <span className="brand-words">
              <strong>{site?.name ?? 'Mesa'}</strong>
              {site?.description && <small>{site.description}</small>}
            </span>
          </Link>

          <MenuButton path={path} />

          <nav id="site-nav" className="nav" aria-label="Main">
            {primary && <MenuList items={primary.items} current={current} />}
            <Suspense><SearchForm /></Suspense>
            <div className="tools">
              {languages.length > 1 && languages.map(language => (
                <Link key={language.slug} href={toPath(language.url)} className={`lang${language.current ? ' current' : ''}`} aria-current={language.current ? 'true' : undefined}>
                  {language.slug.toUpperCase()}
                </Link>
              ))}
              {page.store && (
                <Link href={toPath(page.store.account)} className={`icon-link${page.store.signedIn ? ' signed' : ''}`} title="My account">
                  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
                </Link>
              )}
              {page.cart && (
                <Link href={toPath(page.cart.url)} className="icon-link cart-link" title="Cart">
                  <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 7h15l-1.5 8H7.5z" /><path d="M6 7 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>
                  {page.cart.count > 0 && <span className="count">{page.cart.count}</span>}
                </Link>
              )}
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      <main className="site-main">{children}</main>

      <footer className="footer">
        <div className="container">
          <div className="footer-columns">
            <div>
              <div className="footer-name">{site?.name}</div>
              {site?.description && <p className="footer-tagline">{site.description}</p>}
              {social && (
                <ul className="social">
                  {social.items.map(item => <li key={item.id}><a href={item.url} rel="noopener">{item.title}</a></li>)}
                </ul>
              )}
            </div>
            {zones.flatMap(([zone, widgets]) => widgets.map(widget => (
              <div key={`${zone}-${widget.id}`}>
                {widget.title && <h3>{widget.title}</h3>}
                <HtmlContent html={widget.content} />
              </div>
            )))}
          </div>
          <div className="footer-bottom">
            {footerLinks && (
              <ul>
                {footerLinks.items.map(item => (
                  <li key={item.id}>{isInternal(item.url) ? <Link href={toPath(item.url)}>{item.title}</Link> : <a href={item.url}>{item.title}</a>}</li>
                ))}
              </ul>
            )}
            <p>© {new Date().getFullYear()} {site?.name} · Content from <a href="https://kitloom.dev">kitloom</a>, drawn by <a href="https://nextjs.org">Next.js</a></p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function MenuList({ items, current }: { items: MenuItem[]; current: string }) {
  const link = (item: MenuItem) => isInternal(item.url)
    ? <Link href={toPath(item.url)} aria-current={toPath(item.url) === current ? 'page' : undefined}>{item.title}</Link>
    : <a href={item.url} target={item.target || undefined} rel="noopener">{item.title}</a>

  return (
    <ul className="menu">
      {items.map(item => (
        <li key={item.id}>
          {link(item)}
          {item.children.length > 0 && (
            <ul className="submenu">{item.children.map(child => <li key={child.id}>{link(child)}</li>)}</ul>
          )}
        </li>
      ))}
    </ul>
  )
}
