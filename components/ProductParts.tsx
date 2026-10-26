'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { toPath } from '@/lib/links'
import type { ProductDetail } from '@/lib/types'
import { AddToCart } from './AddToCart'
import { useNotice } from './Notice'
import { Turnstile, useProtection, type TurnstileHandle } from './Turnstile'

export function Gallery({ product }: { product: ProductDetail }) {
  const [picture, setPicture] = useState(0)
  const shown = product.gallery[picture]

  return (
    <div className="gallery">
      <div className="gallery-main card">
        {shown && <img src={shown.full} alt={shown.alt} width={600} height={600} />}
        {product.onSale && <span className="badge sale">−{product.discount}%</span>}
      </div>
      {product.gallery.length > 1 && (
        <div className="thumbs">
          {product.gallery.map((image, index) => (
            <button key={image.full} type="button" className={index === picture ? 'active' : ''} onClick={() => setPicture(index)} aria-label={`Picture ${index + 1}`}>
              <img src={image.thumb} alt={image.alt} width={120} height={120} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function BuyBox({ product, cartUrl }: { product: ProductDetail; cartUrl?: string }) {
  const [quantity, setQuantity] = useState(1)
  const max = product.maxQuantity || 999

  return (
    <div className="buy">
      {product.type !== 'variable' && product.inStock && (
        <span className="quantity">
          <span className="visually-hidden">Quantity</span>
          <button type="button" aria-label="Less" onClick={() => setQuantity(q => Math.max(1, q - 1))}>−</button>
          <input type="number" min={1} max={max} value={quantity} onChange={e => setQuantity(Math.max(1, Math.min(max, Number(e.target.value) || 1)))} />
          <button type="button" aria-label="More" onClick={() => setQuantity(q => Math.min(max, q + 1))}>+</button>
        </span>
      )}
      <AddToCart product={product} quantity={quantity} cartUrl={cartUrl} />
    </div>
  )
}

/**
 * "Add a review", as the shop would draw it: the stars and the words, name and email for a guest
 * when asked, its spam protection. The shop decides whether this visitor may review and says why if not.
 */
export function ReviewForm({ product, signedIn, accountUrl }: { product: ProductDetail; signedIn: boolean; accountUrl?: string }) {
  const router = useRouter()
  const notify = useNotice()
  const form = product.reviewForm!
  const asksNameEmail = !signedIn && form.requireNameEmail
  const [values, setValues] = useState({ rating: 0, hover: 0, review: '', author: '', email: '' })
  const [pending, setPending] = useState<{ rating: number; review: string }[]>([])
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const protection = useProtection(form.protection)
  const turnstile = useRef<TurnstileHandle>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setErrors({}); setFailure(null)
    const result = await api<{ message: string; review: { status: 'approved' | 'hold' } }>('/api/reviews', {
      product: product.id,
      rating: values.rating,
      review: values.review,
      ...(asksNameEmail ? { author: values.author, email: values.email } : {}),
      ...protection.fields(),
    })
    setBusy(false)
    turnstile.current?.reset()
    if (!result.ok) {
      setErrors(result.errors)
      setFailure(Object.keys(result.errors).length ? null : result.message ?? 'The review could not be sent.')
      return
    }
    notify(result.data.message)
    // A review held for moderation is not on the page the site draws; its author sees it here.
    if (result.data.review.status === 'hold') setPending(p => [{ rating: values.rating, review: values.review }, ...p])
    else router.refresh()
    setValues(v => ({ ...v, rating: 0, review: '' }))
  }

  return (
    <>
      {pending.map((review, index) => (
        <div key={index} className="card review held">
          <div className="who"><strong>You</strong><span className="badge">Awaiting approval</span><span className="stars-row"><span className="stars-base">{'★'.repeat(5)}</span><span className="stars-fill" style={{ width: `${review.rating * 20}%` }}>★★★★★</span></span></div>
          <p>{review.review}</p>
        </div>
      ))}
      <div className="card review-form">
        <h3>Add a review</h3>
        {form.mustLogIn && !signedIn ? (
          <p className="muted">Please <Link href={toPath(accountUrl ?? '/my-account/')}>sign in</Link> to leave a review.</p>
        ) : (
          <form noValidate onSubmit={submit}>
            {form.verifiedOnly && <p className="muted">Only customers who bought this product may leave a review.</p>}
            {failure && <p className="failure" role="alert">{failure}</p>}
            <fieldset className={`rate${errors.rating ? ' invalid' : ''}`} onMouseLeave={() => setValues(v => ({ ...v, hover: 0 }))}>
              <legend className="label">Your rating<sup>*</sup></legend>
              {[1, 2, 3, 4, 5].map(n => (
                <label key={n} className={n <= (values.hover || values.rating) ? 'on' : ''} onMouseEnter={() => setValues(v => ({ ...v, hover: n }))}>
                  <input type="radio" name="rating" value={n} checked={values.rating === n} onChange={() => setValues(v => ({ ...v, rating: n }))} className="visually-hidden" />
                  <span aria-hidden="true">★</span>
                  <span className="visually-hidden">{n} of 5</span>
                </label>
              ))}
              {errors.rating && <small className="error">{errors.rating}</small>}
            </fieldset>
            <label className={`field${errors.review ? ' invalid' : ''}`}>
              <span className="label">Your review<sup>*</sup></span>
              <textarea rows={4} value={values.review} onChange={e => setValues(v => ({ ...v, review: e.target.value }))} required />
              {errors.review && <small className="error">{errors.review}</small>}
            </label>
            {asksNameEmail && (
              <div className="fields">
                <label className={`field${errors.author ? ' invalid' : ''}`}><span className="label">Name<sup>*</sup></span><input type="text" autoComplete="name" value={values.author} onChange={e => setValues(v => ({ ...v, author: e.target.value }))} />{errors.author && <small className="error">{errors.author}</small>}</label>
                <label className={`field${errors.email ? ' invalid' : ''}`}><span className="label">Email<sup>*</sup></span><input type="email" autoComplete="email" value={values.email} onChange={e => setValues(v => ({ ...v, email: e.target.value }))} />{errors.email && <small className="error">{errors.email}</small>}</label>
              </div>
            )}
            {form.protection.turnstile && <Turnstile ref={turnstile} siteKey={form.protection.turnstile.siteKey} onToken={protection.setToken} />}
            <button type="submit" className="button" disabled={busy || !protection.ready || !values.rating || !values.review.trim()}>{busy ? 'Sending…' : 'Submit review'}</button>
          </form>
        )}
      </div>
    </>
  )
}
