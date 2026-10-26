import { Breadcrumbs, Pager, PostCard } from '@/components/Bits'
import { HtmlContent } from '@/components/HtmlContent'
import type { TemplateProps } from '@/lib/templates'

const EYEBROW: Record<string, string> = { category: 'Category', tag: 'Tag', author: 'Author', search: 'Search', home: 'Journal', date: 'Archive' }

/** A list of posts: the blog's page, a category, a tag, an author, a month, a search. */
export function Archive({ page }: TemplateProps) {
  const content = page.content
  const posts = page.posts!
  const heading = page.kind === 'search' ? `Results for “${content?.title}”` : content?.title

  return (
    <div className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <header className="archive-head">
        <p className="eyebrow">{EYEBROW[page.kind] ?? 'Archive'}</p>
        <h1>{heading}</h1>
        {content?.content && <HtmlContent html={content.content} className="lede" />}
        {page.kind === 'search' && <p className="lede">{posts.pagination.total} found</p>}
      </header>
      {posts.items.length
        ? <div className="grid cols-3">{posts.items.map(post => <PostCard key={post.id ?? post.link} post={post} />)}</div>
        : <p className="card empty">Nothing here yet.</p>}
      <Pager pagination={posts.pagination} />
    </div>
  )
}
