'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { toPath } from '@/lib/links'
import type { Comment, CommentFormData, Comments as Thread } from '@/lib/types'
import { useNotice } from './Notice'
import { Turnstile, useProtection, type TurnstileHandle } from './Turnstile'

/**
 * A post's comments as the site drew them, then with what this visitor posted on the page: a
 * reply under each comment the site allows one to, the form at the end.
 */
export function Comments({ comments, accountUrl }: { comments: Thread; accountUrl?: string }) {
  const notify = useNotice()
  const [items, setItems] = useState<Comment[]>(comments.items)
  const [count, setCount] = useState(comments.count)
  const [replyTo, setReplyTo] = useState<number | null>(null)

  const posted = (comment: Comment, message: string | null) => {
    const withChild = (list: Comment[]): [Comment[], boolean] => {
      let found = false
      const next = list.map(item => {
        if (item.id === comment.parentId) { found = true; return { ...item, children: [...item.children, comment] } }
        const [children, deeper] = withChild(item.children)
        if (deeper) { found = true; return { ...item, children } }
        return item
      })
      return [next, found]
    }
    setItems(current => {
      const [next, found] = comment.parentId ? withChild(current) : [current, false]
      return found ? next : [...current, comment]
    })
    if (comment.status === 'approved') setCount(c => c + 1)
    setReplyTo(null)
    notify(message ?? 'Your comment is published.')
    setTimeout(() => document.getElementById(`comment-${comment.id}`)?.scrollIntoView({ block: 'center' }), 50)
  }

  const form = comments.open ? comments.form : null

  return (
    <section id="comments" className="comments-section">
      <h2>{count ? `${count} ${count === 1 ? 'comment' : 'comments'}` : 'Comments'}</h2>
      {comments.pages > 1 && (
        <nav className="comment-pages">
          {comments.prevUrl ? <Link href={`${toPath(comments.prevUrl)}#comments`}>← Older comments</Link> : <span />}
          {comments.nextUrl ? <Link href={`${toPath(comments.nextUrl)}#comments`}>Newer comments →</Link> : <span />}
        </nav>
      )}
      {items.length > 0
        ? <CommentList items={items} form={form} replyTo={replyTo} setReplyTo={setReplyTo} onPosted={posted} accountUrl={accountUrl} />
        : comments.open && <p className="muted">No comments yet. Be the first.</p>}
      {form && replyTo === null && <div id="respond"><CommentForm form={form} onPosted={posted} accountUrl={accountUrl} /></div>}
      {!comments.open && <p className="muted">Comments are closed.</p>}
    </section>
  )
}

function CommentList({ items, form, replyTo, setReplyTo, onPosted, accountUrl }: {
  items: Comment[]; form: CommentFormData | null; replyTo: number | null; setReplyTo: (id: number | null) => void
  onPosted: (comment: Comment, message: string | null) => void; accountUrl?: string
}) {
  return (
    <ol className="comments">
      {items.map(comment => (
        <li key={comment.id} id={`comment-${comment.id}`} className="comment">
          <div className={`avatar${comment.author.isPostAuthor ? ' author' : ''}`}>{comment.author.initials}</div>
          <div className={`bubble${comment.status !== 'approved' ? ' held' : ''}`}>
            <div className="who">
              {comment.author.url ? <a href={comment.author.url} rel="nofollow ugc noopener" target="_blank"><strong>{comment.author.name}</strong></a> : <strong>{comment.author.name}</strong>}
              {comment.author.isPostAuthor && <span className="badge sage">Author</span>}
              {comment.status !== 'approved' && <span className="badge">Awaiting moderation</span>}
              <time>{comment.dateText}</time>
            </div>
            {comment.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            {form && !form.mustLogIn && comment.canReply && comment.status === 'approved' && replyTo !== comment.id && (
              <button type="button" className="reply-link" onClick={() => setReplyTo(comment.id)}>Reply</button>
            )}
            {form && replyTo === comment.id && <CommentForm form={form} parent={comment} onPosted={onPosted} onCancel={() => setReplyTo(null)} accountUrl={accountUrl} />}
            {comment.children.length > 0 && <CommentList items={comment.children} form={form} replyTo={replyTo} setReplyTo={setReplyTo} onPosted={onPosted} accountUrl={accountUrl} />}
          </div>
        </li>
      ))}
    </ol>
  )
}

/**
 * "Leave a comment", as the site would draw it for this visitor: name and email for a guest when
 * the site asks for them, "Signed in as …" for a customer, the cookies consent, the protection.
 */
function CommentForm({ form, parent = null, onPosted, onCancel, accountUrl }: {
  form: CommentFormData; parent?: Comment | null; onPosted: (comment: Comment, message: string | null) => void; onCancel?: () => void; accountUrl?: string
}) {
  const router = useRouter()
  const notify = useNotice()
  const guest = !form.loggedInAs
  const [values, setValues] = useState({ author_name: form.author.name, author_email: form.author.email, author_url: form.author.url, content: '', consent: !!form.author.email })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [failure, setFailure] = useState<string | null>(null)
  const protection = useProtection(form.protection)
  const turnstile = useRef<TurnstileHandle>(null)
  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => setValues(v => ({ ...v, [key]: event.target.value }))

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true); setErrors({}); setFailure(null)
    const result = await api<{ message: string | null; status: string; comment: Comment }>('/api/comments', {
      post: form.postId,
      parent: parent?.id ?? 0,
      content: values.content,
      ...(guest ? { author_name: values.author_name, author_email: values.author_email, author_url: values.author_url } : {}),
      ...(guest && form.cookiesOptIn && values.consent ? { 'wp-comment-cookies-consent': 'yes' } : {}),
      ...protection.fields(),
    })
    setBusy(false)
    turnstile.current?.reset()
    if (result.ok) {
      setValues(v => ({ ...v, content: '' }))
      onPosted({ ...result.data.comment, children: result.data.comment.children ?? [] }, result.data.message)
      return
    }
    setErrors(result.errors)
    setFailure(Object.keys(result.errors).length ? null : result.message ?? 'The comment could not be sent.')
  }

  const signOut = async () => {
    await api('/api/account/logout', {})
    notify('You are signed out.')
    router.refresh()
  }

  return (
    <div className={`card comment-form${parent ? ' reply' : ''}`}>
      <h3>{parent ? `Reply to ${parent.author.name}` : 'Leave a comment'}</h3>
      {form.mustLogIn ? (
        <p className="muted">You must be <Link href={toPath(accountUrl ?? '/my-account/')}>signed in</Link> to post a comment.</p>
      ) : (
        <form noValidate onSubmit={submit}>
          {form.loggedInAs
            ? <p className="muted">Signed in as <Link href={toPath(accountUrl ?? '/my-account/')}>{form.loggedInAs.name}</Link>. <button type="button" className="link-button" onClick={signOut}>Sign out?</button></p>
            : form.requireNameEmail && <p className="muted">Your email address will not be published. Name and email are required.</p>}
          {failure && <p className="failure" role="alert">{failure}</p>}
          <label className={`field${errors.content ? ' invalid' : ''}`}>
            <span className="label">Comment</span>
            <textarea rows={5} value={values.content} onChange={set('content')} maxLength={form.maxLengths?.content} required />
            {errors.content && <small className="error">{errors.content}</small>}
          </label>
          {guest && (
            <div className="fields">
              <label className={`field${errors.author_name ? ' invalid' : ''}`}>
                <span className="label">Name{form.requireNameEmail && <sup>*</sup>}</span>
                <input type="text" autoComplete="name" value={values.author_name} onChange={set('author_name')} maxLength={form.maxLengths?.author_name} />
                {errors.author_name && <small className="error">{errors.author_name}</small>}
              </label>
              <label className={`field${errors.author_email ? ' invalid' : ''}`}>
                <span className="label">Email{form.requireNameEmail && <sup>*</sup>}</span>
                <input type="email" autoComplete="email" value={values.author_email} onChange={set('author_email')} maxLength={form.maxLengths?.author_email} />
                {errors.author_email && <small className="error">{errors.author_email}</small>}
              </label>
              <label className={`field wide${errors.author_url ? ' invalid' : ''}`}>
                <span className="label">Website</span>
                <input type="url" autoComplete="url" value={values.author_url} onChange={set('author_url')} maxLength={form.maxLengths?.author_url} />
              </label>
              {form.cookiesOptIn && (
                <label className="check field wide">
                  <input type="checkbox" checked={values.consent} onChange={e => setValues(v => ({ ...v, consent: e.target.checked }))} />
                  <span>Save my name, email and website for the next time I comment.</span>
                </label>
              )}
            </div>
          )}
          {form.protection.turnstile && <Turnstile ref={turnstile} siteKey={form.protection.turnstile.siteKey} onToken={protection.setToken} />}
          <div className="form-actions">
            <button type="submit" className="button" disabled={busy || !protection.ready || !values.content.trim()}>{busy ? 'Sending…' : 'Post comment'}</button>
            {onCancel && <button type="button" className="link-button" onClick={onCancel}>Cancel reply</button>}
          </div>
        </form>
      )}
    </div>
  )
}
