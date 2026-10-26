'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { isInternal, toPath } from '@/lib/links'
import type { Cart, CartResponse, CheckoutData, PlacedOrder } from '@/lib/types'
import { CheckoutField } from './CheckoutField'

/**
 * The checkout drawn from the form the shop configured — its fields, countries, states, gateways,
 * terms — and placed through the site's Store API. A changed address re-prices the cart; the site
 * validates the order against its own rules and answers where to go next, or a message per field.
 */
export function CheckoutForm({ data, cartUrl }: { data: CheckoutData; cartUrl: string }) {
  const router = useRouter()
  const fields = data.fields ?? {}
  const shippingFields = data.shippingFields ?? {}
  const old = data.old ?? {}

  const [cart, setCart] = useState<Cart | null>(data.cart ?? null)
  const [form, setForm] = useState<Record<string, string>>(() => ({
    ...Object.fromEntries(Object.keys(fields).map(name => [name, old[name] ?? ''])),
    ...Object.fromEntries(Object.keys(shippingFields).map(name => [name, old[name] ?? ''])),
    ship_to_different_address: old.ship_to_different_address ? '1' : '',
    shipping_method: data.cart?.shippingRates.find(rate => rate.chosen)?.id ?? '',
    payment_method: old.payment_method ?? data.gateways?.[0]?.id ?? '',
    order_comments: old.order_comments ?? '',
    terms: '',
    createaccount: '',
    account_password: '',
  }))
  const [errors, setErrors] = useState<Record<string, string>>(() => Object.fromEntries(Object.entries(data.errors ?? {}).map(([k, v]) => [k, v[0] ?? ''])))
  const [failure, setFailure] = useState<string | null>(data.message ?? null)
  const [busy, setBusy] = useState(false)

  const set = (name: string) => (value: string) => {
    setForm(f => ({ ...f, [name]: value }))
    setErrors(e => { const { [name]: _, ...rest } = e; return rest })
  }

  const shipsElsewhere = !!data.shipToDifferentAddress && form.ship_to_different_address === '1'
  const addressOf = (prefix: string) => ({ country: form[`${prefix}_country`] ?? '', state: form[`${prefix}_state`] ?? '', postcode: form[`${prefix}_postcode`] ?? '', city: form[`${prefix}_city`] ?? '' })
  const destination = JSON.stringify([addressOf('billing'), shipsElsewhere ? addressOf('shipping') : null])
  const first = useRef(true)

  // A changed address re-prices the cart: the shop answers with the rates of that address.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    const timer = setTimeout(async () => {
      const [billing, shipping] = JSON.parse(destination)
      const result = await api<CartResponse>('/api/cart/customer', { billing_address: billing, shipping_address: shipping ?? billing })
      if (!result.ok) { setFailure(result.message); return }
      setFailure(null)
      setCart(result.data.cart)
      const rates = result.data.cart.shippingRates
      setForm(f => rates.some(rate => rate.id === f.shipping_method) ? f : { ...f, shipping_method: rates.find(r => r.chosen)?.id ?? rates[0]?.id ?? '' })
    }, 500)
    return () => clearTimeout(timer)
  }, [destination])

  const pickRate = async (id: string) => {
    set('shipping_method')(id)
    const result = await api<CartResponse>('/api/cart/shipping', { shipping_method: id })
    if (result.ok) setCart(result.data.cart)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setFailure(null)
    const result = await api<PlacedOrder>('/api/checkout', form)
    if (result.ok) {
      const next = result.data.redirect
      // "Order received" is a page of the site, which the theme draws; a gateway's page is the gateway's.
      if (isInternal(next)) { router.push(toPath(next)); router.refresh() } else window.location.assign(next)
      return
    }
    setBusy(false)
    setErrors(result.errors)
    setFailure(result.message)
    setTimeout(() => document.querySelector('.checkout .invalid')?.scrollIntoView({ block: 'center' }), 50)
  }

  if (!cart || cart.isEmpty) {
    return <div className="card empty"><p>Nothing to check out yet.</p><Link href={toPath(cartUrl)} className="button">Back to the cart</Link></div>
  }

  const gateways = data.gateways ?? []
  const fieldProps = (prefix: 'billing' | 'shipping') => ({
    country: form[`${prefix}_country`] ?? '',
    countries: prefix === 'billing' ? data.countries : data.shippingCountries,
    states: data.states,
    statesOptional: data.statesOptional,
    labels: data.addressLabels,
  })

  return (
    <form className="checkout" noValidate onSubmit={submit}>
      <div className="details">
        <p className="eyebrow">Checkout</p>
        <h1>Where should it go?</h1>
        {failure && <p className="failure" role="alert">{failure}</p>}

        <section className="block">
          <h2>Billing details</h2>
          <div className="fields">
            {Object.entries(fields).map(([name, field]) => (
              <CheckoutField key={name} name={name} field={field} value={form[name] ?? ''} onChange={set(name)} error={errors[name]} {...fieldProps('billing')} />
            ))}
          </div>
        </section>

        {data.shipToDifferentAddress && (
          <section className="block">
            <label className="check strong">
              <input type="checkbox" checked={shipsElsewhere} onChange={e => set('ship_to_different_address')(e.target.checked ? '1' : '')} />
              <span>Ship to a different address</span>
            </label>
            {shipsElsewhere && (
              <div className="fields">
                {Object.entries(shippingFields).map(([name, field]) => (
                  <CheckoutField key={name} name={name} field={field} value={form[name] ?? ''} onChange={set(name)} error={errors[name]} {...fieldProps('shipping')} />
                ))}
              </div>
            )}
          </section>
        )}

        {data.account && (
          <section className="block">
            {!data.account.required && (
              <label className="check strong">
                <input type="checkbox" checked={form.createaccount === '1'} onChange={e => set('createaccount')(e.target.checked ? '1' : '')} />
                <span>Create an account for next time</span>
              </label>
            )}
            {data.account.password && (data.account.required || form.createaccount === '1') && (
              <label className={`field${errors.account_password ? ' invalid' : ''}`}>
                <span className="label">Account password</span>
                <input type="password" autoComplete="new-password" value={form.account_password} onChange={e => set('account_password')(e.target.value)} />
                {errors.account_password && <small className="error">{errors.account_password}</small>}
              </label>
            )}
          </section>
        )}

        <section className="block">
          <label className="field">
            <span className="label">Order notes <small>(optional)</small></span>
            <textarea rows={3} value={form.order_comments} onChange={e => set('order_comments')(e.target.value)} placeholder="Notes about your order, e.g. special notes for delivery." />
          </label>
        </section>
      </div>

      <aside className="card order-box">
        <h2>Your order</h2>
        <ul className="order-lines">
          {cart.lines.map(line => <li key={line.key}><span>{line.product.title} <small>× {line.quantity}</small></span><strong>{line.totalFormatted}</strong></li>)}
        </ul>
        {cart.needsShipping && (
          <div className={`choice${errors.shipping_method ? ' invalid' : ''}`}>
            <h3>Delivery</h3>
            {cart.shippingRates.map(rate => (
              <label key={rate.id} className="radio">
                <input type="radio" name="shipping_method" value={rate.id} checked={form.shipping_method === rate.id} onChange={() => pickRate(rate.id)} />
                <span>{rate.label}</span><strong>{rate.costFormatted}</strong>
              </label>
            ))}
            {!cart.shippingRates.length && <p className="muted">No delivery option for this address yet.</p>}
            {errors.shipping_method && <small className="error">{errors.shipping_method}</small>}
          </div>
        )}
        <dl className="totals">
          <dt>Subtotal</dt><dd>{cart.subtotalFormatted}</dd>
          {cart.needsShipping && <><dt>Delivery</dt><dd>{cart.shippingTotalFormatted}</dd></>}
          <dt className="grand">Total</dt><dd className="grand">{cart.totalFormatted}</dd>
        </dl>
        {gateways.length > 0 && (
          <div className={`choice${errors.payment_method ? ' invalid' : ''}`}>
            <h3>Payment</h3>
            {gateways.map(gateway => (
              <label key={gateway.id} className="radio stacked">
                <span className="radio-row">
                  <input type="radio" name="payment_method" value={gateway.id} checked={form.payment_method === gateway.id} onChange={() => set('payment_method')(gateway.id)} />
                  <span>{gateway.title}</span>
                </span>
                {form.payment_method === gateway.id && gateway.description && <small className="muted">{gateway.description}</small>}
              </label>
            ))}
            {errors.payment_method && <small className="error">{errors.payment_method}</small>}
          </div>
        )}
        {data.terms && (
          <label className={`check terms${errors.terms ? ' invalid' : ''}`}>
            <input type="checkbox" checked={form.terms === '1'} onChange={e => set('terms')(e.target.checked ? '1' : '')} />
            <span>I have read and agree to the <a href={data.terms.url} target="_blank" rel="noopener">{data.terms.title}</a></span>
          </label>
        )}
        <button type="submit" className="button wide" disabled={busy}>{busy ? 'Placing…' : `Place order · ${cart.totalFormatted}`}</button>
        <Link href={toPath(cartUrl)} className="continue">← Back to the cart</Link>
      </aside>
    </form>
  )
}
