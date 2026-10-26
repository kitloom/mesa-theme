import Link from 'next/link'
import { Breadcrumbs, Stars } from '@/components/Bits'
import { HtmlContent } from '@/components/HtmlContent'
import { ProductCard } from '@/components/ProductCard'
import { BuyBox, Gallery, ReviewForm } from '@/components/ProductParts'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'

/** A product: its gallery, price, attributes, the quantity and "Add to cart", its reviews and what goes with it. */
export function SingleProduct({ page }: TemplateProps) {
  const product = page.product!
  const content = page.content!
  const total = product.reviews.total
  const rows = ['5', '4', '3', '2', '1'].map(stars => ({ stars, count: product.ratingCounts[stars] ?? 0, share: total ? ((product.ratingCounts[stars] ?? 0) / total) * 100 : 0 }))

  return (
    <article className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <div className="product-top">
        <Gallery product={product} />
        <div className="summary">
          {product.categories.length > 0 && <p className="eyebrow">{product.categories.map(category => <Link key={category.id} href={toPath(category.link)}>{category.name}</Link>)}</p>}
          <h1>{product.title}</h1>
          {product.reviewCount > 0 && <Stars rating={product.rating} count={product.reviewCount} />}
          <p className="product-price">
            {product.onSale && <s>{product.regularPriceFormatted}</s>}
            <strong>{product.priceFormatted}</strong>
            {product.inStock ? <span className="badge sage">In stock</span> : <span className="badge">Sold out</span>}
          </p>
          <HtmlContent html={product.shortDescription} className="short" />
          {product.attributes.length > 0 && (
            <dl className="attributes">
              {product.attributes.map(attribute => <div key={attribute.name}><dt>{attribute.label}</dt><dd>{attribute.values.join(', ')}</dd></div>)}
              <div><dt>SKU</dt><dd>{product.sku}</dd></div>
            </dl>
          )}
          <BuyBox product={product} cartUrl={page.cart?.url} />
          {product.tags.length > 0 && <ul className="pill-list">{product.tags.map(tag => <li key={tag.id}><Link href={toPath(tag.link)} className="pill">{tag.name}</Link></li>)}</ul>}
        </div>
      </div>

      {content.content && <HtmlContent html={content.content} className="prose product-description" />}

      {(total > 0 || product.reviewsAllowed) && (
        <section id="reviews" className="reviews">
          <div className="section-head">
            <h2>{total ? `${total} ${total === 1 ? 'review' : 'reviews'}` : 'Reviews'}</h2>
            {total > 0 && <Stars rating={product.rating} />}
          </div>
          <div className="reviews-grid">
            <div>
              {total > 0 ? (
                <ul className="bars">
                  {rows.map(row => <li key={row.stars}><span>{row.stars} ★</span><span className="rating-bar"><span style={{ width: `${row.share}%` }} /></span><span className="n">{row.count}</span></li>)}
                </ul>
              ) : <p className="muted">There are no reviews yet.</p>}
            </div>
            <div className="review-list">
              {product.reviewsAllowed && product.reviewForm && (
                <ReviewForm key={page.url} product={product} signedIn={page.store?.signedIn ?? false} accountUrl={page.store?.account} />
              )}
              {product.reviews.items.map(review => (
                <div key={review.id} className="card review">
                  <div className="who">
                    <strong>{review.author}</strong>
                    {review.verified && <span className="badge sage">Verified</span>}
                    <Stars rating={review.rating} />
                    <time>{review.dateText}</time>
                  </div>
                  <p>{review.content}</p>
                  {(review.replies ?? []).map(reply => (
                    <div key={reply.id} className="review-reply"><div className="who"><strong>{reply.author}</strong><time>{reply.dateText}</time></div><p>{reply.content}</p></div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {product.related.length > 0 && (
        <section className="related">
          <div className="section-head"><h2>Goes well with</h2></div>
          <div className="grid cols-4">{product.related.map(item => <ProductCard key={item.id} product={item} cartUrl={page.cart?.url} />)}</div>
        </section>
      )}
    </article>
  )
}
