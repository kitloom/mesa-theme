'use client'

import { usePathname, useRouter } from 'next/navigation'

/** The catalog's sort order; a new order starts from the first page. */
export function SortSelect({ orderBy, orders }: { orderBy: string; orders: Record<string, string> }) {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <label className="sort">
      <span>Sort</span>
      <select
        className="input"
        value={orderBy}
        onChange={event => {
          const base = pathname.replace(/\/page\/\d+\/$/, '/')
          router.push(event.target.value === 'menu_order' ? base : `${base}?orderby=${encodeURIComponent(event.target.value)}`)
        }}
      >
        {Object.entries(orders).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
  )
}
