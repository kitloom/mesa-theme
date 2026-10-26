import Link from 'next/link'
import { toPath } from '@/lib/links'
import type { Product } from '@/lib/types'
import { AddToCart } from './AddToCart'
import { Stars } from './Bits'

export function ProductCard({ product, cartUrl }: { product: Product; cartUrl?: string }) {
  return (
    <article className="card product-card">
      <Link href={toPath(product.link)} className="picture" aria-label={product.title}>
        {product.image && <img src={product.image} alt={product.title} width={600} height={600} loading="lazy" />}
        {product.onSale ? <span className="badge sale">−{product.discount}%</span> : product.featured ? <span className="badge">Favourite</span> : null}
      </Link>
      <div className="body">
        {product.category && <Link href={toPath(product.category.link)} className="category">{product.category.name}</Link>}
        <h3><Link href={toPath(product.link)}>{product.title}</Link></h3>
        {product.reviewCount > 0 && <Stars rating={product.rating} count={product.reviewCount} />}
        <div className="price-row">
          <span className="price">
            {product.onSale && <s>{product.regularPriceFormatted}</s>}
            <strong>{product.priceFormatted}</strong>
          </span>
          {product.inStock ? <AddToCart product={product} compact cartUrl={cartUrl} /> : <span className="badge sage">Sold out</span>}
        </div>
      </div>
    </article>
  )
}
