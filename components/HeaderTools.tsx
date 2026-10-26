'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'

/** The phone's menu button: opens the nav, closes it on the next page. */
export function MenuButton({ path }: { path: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    document.getElementById('site-nav')?.classList.toggle('open', open)
  }, [open])

  useEffect(() => setOpen(false), [path])

  return (
    <button className="burger" aria-expanded={open} aria-controls="site-nav" onClick={() => setOpen(o => !o)}>
      <span className="visually-hidden">Menu</span>
      <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2">
        {open ? <path d="M5 5l14 14M19 5L5 19" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
      </svg>
    </button>
  )
}

export function SearchForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [query, setQuery] = useState(params.get('s') ?? '')

  useEffect(() => setQuery(params.get('s') ?? ''), [params])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (query.trim()) router.push(`/?s=${encodeURIComponent(query.trim())}`)
  }

  return (
    <form className="search" role="search" onSubmit={submit}>
      <input type="search" name="s" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search…" aria-label="Search the site" />
      <button type="submit" aria-label="Search">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      </button>
    </form>
  )
}

/**
 * Light or dark by choice, kept in the browser; without a choice the system decides. Both icons are
 * drawn and CSS shows one, so the server's HTML and the browser's agree before the choice is read.
 */
export function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches
    root.dataset.theme = dark ? 'light' : 'dark'
    try { localStorage.setItem('theme', root.dataset.theme) } catch {}
  }

  return (
    <button className="icon-link theme-toggle" onClick={toggle} aria-label="Switch light and dark">
      <svg className="moon" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 14.5A8 8 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" /></svg>
      <svg className="sun" viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5" /></svg>
    </button>
  )
}
