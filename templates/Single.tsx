import Link from 'next/link'
import { Breadcrumbs, termsOf } from '@/components/Bits'
import { Comments } from '@/components/Comments'
import { HtmlContent } from '@/components/HtmlContent'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'

/** A post or a page, with its comments when the site has them on. */
export function Single({ page }: TemplateProps) {
  const content = page.content!
  const isPost = content.type === 'post'
  const categories = termsOf(content, 'category')
  const tags = termsOf(content, 'post_tag')

  return (
    <article className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <header className="single-head">
        {categories.length > 0 && <div className="eyebrow">{categories.map(term => <Link key={term.id} href={toPath(term.link)}>{term.name}</Link>)}</div>}
        <h1>{content.title}</h1>
        {isPost && content.excerpt && <p className="lede">{content.excerpt}</p>}
        {isPost && content.formattedDate && (
          <p className="muted"><time dateTime={content.date ?? undefined}>{content.formattedDate}</time>{content.author && ` · by ${content.author.name}`}</p>
        )}
      </header>
      {content.thumbnail && (
        <figure className="single-cover">
          <img src={content.thumbnail.url} alt={content.thumbnail.alt} width={content.thumbnail.width} height={content.thumbnail.height} />
        </figure>
      )}
      <HtmlContent html={content.content} className="prose" />
      {tags.length > 0 && (
        <ul className="pill-list tags">{tags.map(tag => <li key={tag.id}><Link href={toPath(tag.link)} className="pill">#{tag.name}</Link></li>)}</ul>
      )}
      {page.comments && (page.comments.count > 0 || page.comments.open || page.comments.items.length > 0) && (
        <Comments key={page.url} comments={page.comments} accountUrl={page.store?.account} />
      )}
    </article>
  )
}
