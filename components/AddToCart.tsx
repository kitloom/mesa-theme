'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api'
import { toPath } from '@/lib/links'
import type { CartResponse, Product } from '@/lib/types'
import { useNotice } from './Notice'

/**
 * Puts the product into the visitor's cart on the site, then asks the server to draw the page
 * again: the header's count is the site's, as on any other page.
 */
export function AddToCart({ product, quantity = 1, compact = false, cartUrl }: { product: Product; quantity?: number; compact?: boolean; cartUrl?: string }) {
  const router = useRouter()
  const notify = useNotice()
  const [adding, setAdding] = useState(false)

  if (product.type === 'variable') {
    return <Link href={toPath(product.link)} className={`button ghost${compact ? ' small' : ''}`}>Choose options</Link>
  }

  const canAdd = product.purchasable && product.inStock

  const add = async () => {
    setAdding(true)
    const result = await api<CartResponse>('/api/cart/add', { product_id: product.id, quantity })
    setAdding(false)
    const count = result.data?.cart?.count ?? 0
    notify(result.message ?? (result.ok ? 'Added to your cart.' : 'The cart could not be changed.'), result.ok && count ? { label: `View cart (${count})`, href: toPath(cartUrl ?? '/cart/') } : undefined)
    if (result.ok) router.refresh()
  }

  return (
    <button type="button" className={`button${compact ? ' small' : ''}`} disabled={!canAdd || adding} onClick={add} aria-label={compact ? `Add ${product.title} to cart` : undefined}>
      {adding
        ? <svg className="spin" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3a9 9 0 1 0 9 9" /></svg>
        : <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 7h15l-1.5 8H7.5z" /><path d="M6 7 5 3H2" /><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /></svg>}
      {!compact && <span>{canAdd ? 'Add to cart' : 'Sold out'}</span>}
    </button>
  )
}
