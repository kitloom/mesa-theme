'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { api } from '@/lib/api'
import { toPath } from '@/lib/links'
import type { Cart, CartResponse } from '@/lib/types'
import { useNotice } from './Notice'

/** The cart the site drew for this visitor, changed through the site: a quantity, a line taken out. */
export function CartView({ initial, shopUrl, checkoutUrl }: { initial: Cart | null; shopUrl: string; checkoutUrl: string }) {
  const router = useRouter()
  const notify = useNotice()
  const [cart, setCart] = useState(initial)
  const [busy, setBusy] = useState(false)

  const change = async (path: string, body: unknown) => {
    setBusy(true)
    const result = await api<CartResponse>(path, body)
    setBusy(false)
    if (result.data?.cart) setCart(result.data.cart)
    notify(result.message ?? (result.ok ? null : 'The cart could not be changed.'))
    router.refresh()
  }

  const setQuantity = (key: string, quantity: number) =>
    quantity < 1 ? change('/api/cart/remove', { key }) : change('/api/cart/update', { quantities: { [key]: quantity } })

  if (!cart || cart.isEmpty) {
    return (
      <div className="card empty">
        <p>Your cart is empty.</p>
        <Link href={toPath(shopUrl)} className="button">Back to the shop</Link>
      </div>
    )
  }

  const rate = cart.shippingRates.find(r => r.chosen)

  return (
    <div className={`cart${busy ? ' busy' : ''}`}>
      <ul className="lines">
        {cart.lines.map(line => (
          <li key={line.key} className="card line">
            <Link href={toPath(line.product.link)} className="thumb">{line.product.image && <img src={line.product.image} alt={line.product.title} width={120} height={120} />}</Link>
            <div className="what">
              <Link href={toPath(line.product.link)} className="title">{line.product.title}</Link>
              {line.variation?.title && <small>{line.variation.title}</small>}
              <small>{line.priceFormatted} each</small>
            </div>
            <span className="quantity small">
              <button type="button" aria-label="Less" disabled={busy} onClick={() => setQuantity(line.key, line.quantity - 1)}>−</button>
              <span className="n">{line.quantity}</span>
              <button type="button" aria-label="More" disabled={busy || line.quantity >= line.maxQuantity} onClick={() => setQuantity(line.key, line.quantity + 1)}>+</button>
            </span>
            <strong className="line-total">{line.totalFormatted}</strong>
            <button type="button" className="remove" disabled={busy} aria-label={`Remove ${line.product.title}`} onClick={() => change('/api/cart/remove', { key: line.key })}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </li>
        ))}
      </ul>
      <aside className="card summary-box">
        <h2>Summary</h2>
        <dl className="totals">
          <dt>Subtotal</dt><dd>{cart.subtotalFormatted}</dd>
          {cart.needsShipping && <><dt>Shipping{rate && <small> · {rate.label}</small>}</dt><dd>{cart.shippingTotalFormatted}</dd></>}
          <dt className="grand">Total</dt><dd className="grand">{cart.totalFormatted}</dd>
        </dl>
        {cart.untilFreeShippingFormatted && <p className="hint">{cart.untilFreeShippingFormatted} more for free delivery.</p>}
        <Link href={toPath(checkoutUrl)} className="button wide">Proceed to checkout →</Link>
        <Link href={toPath(shopUrl)} className="continue">← Continue shopping</Link>
      </aside>
    </div>
  )
}
