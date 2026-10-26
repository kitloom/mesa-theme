import Link from 'next/link'
import { toPath } from '@/lib/links'
import type { Breadcrumb, Entry, Pagination, ProductCategory, Term } from '@/lib/types'

export function Breadcrumbs({ items }: { items: Breadcrumb[] | undefined }) {
  if (!items || items.length < 2) return null
  return (
    <nav className="crumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => (
          <li key={item.url}>
            {index < items.length - 1 ? <Link href={toPath(item.url)}>{item.title}</Link> : <span aria-current="page">{item.title}</span>}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  const label = `${rating.toFixed(1)} out of 5`
  return (
    <span className="stars" title={label}>
      <span className="stars-row" aria-hidden="true">
        <span className="stars-fill" style={{ width: `${(rating / 5) * 100}%` }}>★★★★★</span>
        <span className="stars-base">★★★★★</span>
      </span>
      <span className="visually-hidden">{label}</span>
      {count !== undefined && <small>({count})</small>}
    </span>
  )
}

const termsOf = (post: Entry, taxonomy?: string): Term[] => {
  const terms = post.terms
  if (Array.isArray(terms)) return []
  return taxonomy ? terms[taxonomy] ?? [] : terms.category ?? terms.product_cat ?? Object.values(terms)[0] ?? []
}

export { termsOf }

export function PostCard({ post }: { post: Entry }) {
  const categories = termsOf(post)
  return (
    <article className="card post-card">
      <Link href={toPath(post.link)} className="cover" aria-label={post.title}>
        {post.thumbnail && <img src={post.thumbnail.url} alt={post.thumbnail.alt} width={post.thumbnail.width} height={post.thumbnail.height} loading="lazy" />}
      </Link>
      <div className="body">
        {categories.length > 0 && <div className="eyebrow">{categories.map(term => <Link key={term.id} href={toPath(term.link)}>{term.name}</Link>)}</div>}
        <h3><Link href={toPath(post.link)}>{post.title}</Link></h3>
        {post.excerpt && <p className="excerpt">{post.excerpt}</p>}
        {post.formattedDate && <p className="meta"><time dateTime={post.date ?? undefined}>{post.formattedDate}</time>{post.author && ` · ${post.author.name}`}</p>}
      </div>
    </article>
  )
}

export function CategoryCard({ category }: { category: ProductCategory }) {
  return (
    <Link href={toPath(category.link)} className="card category-card">
      {category.image && <img src={category.image} alt={category.name} width={600} height={400} loading="lazy" />}
      <div className="body">
        <h3>{category.name}</h3>
        <p>{category.description}</p>
        <span className="go">{category.count} products →</span>
      </div>
    </Link>
  )
}

export function Pager({ pagination }: { pagination: Pagination }) {
  if (pagination.pages < 2) return null
  return (
    <nav className="pager" aria-label="Pages">
      {pagination.previous ? <Link href={toPath(pagination.previous)} className="button ghost small">← Newer</Link> : <span />}
      <span className="muted">Page {pagination.page} of {pagination.pages}</span>
      {pagination.next ? <Link href={toPath(pagination.next)} className="button ghost small">Older →</Link> : <span />}
    </nav>
  )
}
