import Link from 'next/link'
import { Breadcrumbs } from '@/components/Bits'
import { CheckoutForm } from '@/components/CheckoutForm'
import { OrderDetails, OrderFacts } from '@/components/Orders'
import { shortcode } from '@/lib/page'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'
import type { CheckoutData } from '@/lib/types'

const label = (key: string) => key.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())

/** The checkout page: the form, or — with `?order-received=` — the order the visitor just placed. */
export function Checkout({ page }: TemplateProps) {
  const data = shortcode<CheckoutData>(page, 'woocommerce_checkout')
  const shop = toPath(page.store?.shop ?? '/shop/')

  return (
    <div className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      {!data ? (
        <><h1>Checkout</h1><p className="lede">The checkout is not available right now.</p></>
      ) : data.view === 'received' && data.order ? (
        <div className="received">
          <div className="thanks">
            <svg className="thanks-art" viewBox="0 0 120 70" aria-hidden="true">
              <circle cx="82" cy="26" r="16" fill="var(--sun)" />
              <path d="M0 56c20-14 40-14 60-3s40 9 60-4v21H0z" fill="var(--accent)" opacity="0.85" />
              <path d="M38 34l8 8 16-17" stroke="var(--sage)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="eyebrow">Order received</p>
            <h1>Thank you, {data.order.customer}.</h1>
            <p className="lede">Your order is on its way to being packed. A confirmation went to {data.order.email}.</p>
          </div>
          <OrderFacts order={data.order} />
          {(data.paymentInstructions || data.bankDetails?.length) ? (
            <div className="card instructions">
              <h2>How to pay</h2>
              {data.paymentInstructions && <p>{data.paymentInstructions}</p>}
              {data.bankDetails?.map((account, index) => (
                <dl key={index} className="bank">{Object.entries(account).filter(([, v]) => v).map(([k, v]) => <div key={k}><dt>{label(k)}</dt><dd>{v}</dd></div>)}</dl>
              ))}
            </div>
          ) : null}
          <OrderDetails order={data.order} />
          <p className="back"><Link href={shop} className="button ghost">← Back to the shop</Link></p>
        </div>
      ) : data.view !== 'form' ? (
        <><h1>Checkout</h1><p className="lede">{data.message ?? 'This step is taken on the site.'}</p><a href={page.url} className="button">Continue on {page.site?.name} →</a></>
      ) : (
        <CheckoutForm key={page.url} data={data} cartUrl={page.cart?.url ?? '/cart/'} />
      )}
    </div>
  )
}
