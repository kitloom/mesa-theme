import { siteFetch } from '@/lib/site'
import type { Page } from '@/lib/types'

/**
 * One page of the site as JSON, as the visitor: what the theme's templates are drawn from, for a
 * script that wants the same (the regression run). The site's status comes along — a 404 stays one.
 */
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get('path') ?? '/'

  if (!path.startsWith('/') || path.startsWith('//')) {
    return Response.json({ message: 'A path of the site is expected.' }, { status: 400 })
  }

  const result = await siteFetch<Page>(path, { keep: true })
  return Response.json(result.data ?? { message: 'The site did not answer with a page.' }, { status: result.data ? result.status : 502 })
}
