import Link from 'next/link'
import { CategoryCard } from '@/components/Bits'
import { ProductCard } from '@/components/ProductCard'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'
import type { Product, ProductCategory, Shortcode } from '@/lib/types'

/** The front page: the record's title, excerpt and picture as the banner, then the owner's shortcodes in order. */
export function FrontPage({ page }: TemplateProps) {
  const content = page.content
  const storefront = page.storefront
  const blocks: Shortcode[] = Array.isArray(page.shortcodes) ? [] : Object.values(page.shortcodes ?? {})
  const journal = Object.values(page.menus ?? {}).flatMap(menu => menu.items).find(item => /journal|blog/i.test(item.title))

  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-words">
            <p className="eyebrow">{page.site?.description}</p>
            <h1>{content?.title}</h1>
            <p className="lede">{content?.excerpt}</p>
            <div className="hero-actions">
              {storefront?.button && <Link href={toPath(storefront.button.url)} className="button">{storefront.button.label}</Link>}
              {journal && <Link href={toPath(journal.url)} className="button ghost">{journal.title}</Link>}
            </div>
          </div>
          {content?.thumbnail && (
            <div className="hero-picture">
              <svg className="hero-sun" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="50" /></svg>
              <img src={content.thumbnail.url} alt={content.thumbnail.alt} width={content.thumbnail.width} height={content.thumbnail.height} />
            </div>
          )}
        </div>
        <svg className="dunes" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 90 C 220 30, 420 40, 640 86 S 1080 140, 1440 70 V160 H0 Z" fill="var(--rose)" opacity="0.35" />
          <path d="M0 120 C 260 70, 520 80, 760 118 S 1180 150, 1440 104 V160 H0 Z" fill="var(--accent)" opacity="0.28" />
          <path d="M0 140 C 300 112, 620 118, 900 138 S 1260 150, 1440 132 V160 H0 Z" fill="var(--bg)" />
        </svg>
      </section>

      {blocks.map((block, index) => {
        const args = Array.isArray(block.arguments) ? {} : block.arguments
        return (
          <section key={index} className="section container">
            <div className="section-head">
              <h2>{args.title}</h2>
              {args.link && <Link href={toPath(args.link)} className="more">See all →</Link>}
            </div>
            {block.shortcode === 'products' && (
              <div className="grid cols-4">{(block.items as Product[]).map(product => <ProductCard key={product.id} product={product} cartUrl={page.cart?.url} />)}</div>
            )}
            {block.shortcode === 'product_categories' && (
              <div className="grid cols-3">{(block.items as ProductCategory[]).map(category => <CategoryCard key={category.id} category={category} />)}</div>
            )}
          </section>
        )
      })}

      {storefront?.benefits && (
        <section className="benefits">
          <div className="container">
            <h2>{storefront.benefits.heading}</h2>
            <div className="grid cols-3">
              {storefront.benefits.items.map((item, index) => (
                <div key={item.title} className="benefit">
                  <span className="benefit-mark" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
