import { Breadcrumbs } from '@/components/Bits'
import { CartView } from '@/components/CartView'
import { shortcode } from '@/lib/page'
import type { TemplateProps } from '@/lib/templates'
import type { Cart as CartData } from '@/lib/types'

/** The shop's cart page — also what its checkout page is while the cart is empty. */
export function Cart({ page }: TemplateProps) {
  const cart = shortcode<{ cart?: CartData }>(page, 'woocommerce_cart')?.cart ?? null
  return (
    <div className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <p className="eyebrow">Shop</p>
      <h1>{page.content?.title ?? 'Cart'}</h1>
      <CartView key={JSON.stringify(cart?.lines.map(l => [l.key, l.quantity]) ?? [])} initial={cart} shopUrl={page.store?.shop ?? '/shop/'} checkoutUrl={page.cart?.checkoutUrl ?? '/checkout/'} />
    </div>
  )
}
