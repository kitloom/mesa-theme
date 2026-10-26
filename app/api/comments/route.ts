import { answer, formFields, siteFetch } from '@/lib/site'

/**
 * A comment on a post or a page — the site's `comments/v1/comments`, as the visitor. The site checks
 * the record, the spam protection and its rules, and answers 201 with the comment as its page
 * presents it, or WordPress's error (400 with a message per field, 409, 429, 403).
 */
export async function POST(request: Request) {
  return answer(await siteFetch('/wp-json/comments/v1/comments', { method: 'POST', keep: true, body: formFields(await request.json().catch(() => ({}))) }))
}
