'use client'

import { useEffect } from 'react'

/** The root layout stays from one page to the next; the page's language goes onto <html> here. */
export function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  return null
}
