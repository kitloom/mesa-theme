'use client'

import { useRouter } from 'next/navigation'
import type { MouseEvent } from 'react'
import { isInternal, rewrite, toPath } from '@/lib/links'

/** Words written in the admin. A click on a link to the site navigates without leaving the app. */
export function HtmlContent({ html, className }: { html: string | null | undefined; className?: string }) {
  const router = useRouter()

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor || anchor.target === '_blank' || event.metaKey || event.ctrlKey) return
    const href = anchor.getAttribute('href') ?? ''
    if (href.startsWith('#') || !isInternal(href)) return
    event.preventDefault()
    router.push(toPath(href))
  }

  return <div className={className} onClick={onClick} dangerouslySetInnerHTML={{ __html: rewrite(html) }} />
}
