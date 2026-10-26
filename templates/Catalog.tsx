import Link from 'next/link'
import { Breadcrumbs } from '@/components/Bits'
import { HtmlContent } from '@/components/HtmlContent'
import { ProductCard } from '@/components/ProductCard'
import { SortSelect } from '@/components/SortSelect'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'

/** The shop page and the product categories: the site's catalog, its categories, orders and pages. */
export function Catalog({ page }: TemplateProps) {
  const catalog = page.catalog!
  const products = catalog.products
  const current = catalog.category
  const pages = products.links.filter(link => link.page !== null)

  return (
    <div className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <header className="catalog-head">
        <div>
          <p className="eyebrow">{current ? 'Category' : 'Shop'}</p>
          <h1>{current?.name ?? page.content?.title ?? 'Shop'}</h1>
          {current?.description ? <p className="lede">{current.description}</p> : page.content?.content ? <HtmlContent html={page.content.content} className="lede" /> : null}
        </div>
        <SortSelect orderBy={catalog.orderBy} orders={catalog.orders} />
      </header>

      {catalog.categories.length > 0 && (
        <ul className="pill-list categories">
          <li><Link href={toPath(catalog.basePath)} className={`pill${current ? '' : ' active'}`}>All</Link></li>
          {catalog.categories.map(category => (
            <li key={category.id}>
              <Link href={toPath(category.link)} className={`pill${current?.id === category.id ? ' active' : ''}`}>{category.name} <small>{category.count}</small></Link>
            </li>
          ))}
        </ul>
      )}

      {products.data.length
        ? <div className="grid cols-4">{products.data.map(product => <ProductCard key={product.id} product={product} cartUrl={page.cart?.url} />)}</div>
        : <p className="card empty">No products match.</p>}

      {products.last_page > 1 && (
        <nav className="catalog-pages" aria-label="Pages">
          {products.prev_page_url && <Link href={toPath(products.prev_page_url)} className="pill">←</Link>}
          {pages.map(link => <Link key={link.label} href={toPath(link.url!)} className={`pill${link.active ? ' active' : ''}`}>{link.page}</Link>)}
          {products.next_page_url && <Link href={toPath(products.next_page_url)} className="pill">→</Link>}
        </nav>
      )}
    </div>
  )
}
