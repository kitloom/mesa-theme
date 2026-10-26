'use client'

import Link from 'next/link'
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

/** A line at the foot of the page for a few seconds: what just happened, and where to go on. */
interface Notice { id: number; text: string; link?: { label: string; href: string } }

const NoticeContext = createContext<(text: string | null | undefined, link?: Notice['link']) => void>(() => {})

export function NoticeProvider({ children }: { children: ReactNode }) {
  const [notice, setNotice] = useState<Notice | null>(null)
  const counter = useRef(0)

  const notify = useCallback((text: string | null | undefined, link?: Notice['link']) => {
    if (!text) return
    const id = ++counter.current
    setNotice({ id, text, link })
    setTimeout(() => setNotice(current => (current?.id === id ? null : current)), 4500)
  }, [])

  return (
    <NoticeContext.Provider value={notify}>
      {children}
      {notice && (
        <div key={notice.id} className="notice" role="status">
          <span>{notice.text}</span>
          {notice.link && <Link href={notice.link.href}>{notice.link.label} →</Link>}
        </div>
      )}
    </NoticeContext.Provider>
  )
}

export const useNotice = () => useContext(NoticeContext)
