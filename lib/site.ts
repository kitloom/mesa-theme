import { cookies, headers } from 'next/headers'
import { SITE_URL } from './config'

/** The theme's cookie that carries the site's own cookies: the visitor's session on the site. */
const JAR = 'kitloom_site'

/** The site's forgery token travels in a cookie of its own; the theme passes by its origin instead. */
const NOT_KEPT = new Set(['XSRF-TOKEN'])

type Jar = Map<string, string>

async function readJar(): Promise<Jar> {
  const value = (await cookies()).get(JAR)?.value
  if (!value) return new Map()
  try {
    return new Map(Object.entries(JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Record<string, string>))
  } catch {
    return new Map()
  }
}

export interface SiteAnswer<T> { status: number; data: T | null }

/**
 * A request to the site as the visitor: with the cookies the site gave them before, the site
 * named as the origin (so a POST passes its forgery check as a form on its own pages does), and
 * the visitor's address and browser for its limits and records.
 *
 * `keep` is for Route Handlers, the one place a response may set cookies: what the site set
 * goes back into the jar. A Server Component only reads — Next sends no cookies from a render.
 */
export async function siteFetch<T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: unknown; keep?: boolean } = {},
): Promise<SiteAnswer<T>> {
  const jar = await readJar()
  const incoming = await headers()
  const visitor = incoming.get('x-forwarded-for')?.split(',')[0]?.trim() || incoming.get('x-real-ip')
  const agent = incoming.get('user-agent')

  const response = await fetch(SITE_URL + path, {
    method: options.method ?? 'GET',
    cache: 'no-store',
    headers: {
      'Accept': 'application/json',
      'Origin': SITE_URL,
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(jar.size ? { Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
      ...(visitor ? { 'X-Forwarded-For': visitor } : {}),
      ...(agent ? { 'User-Agent': agent } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  const given = response.headers.getSetCookie()

  if (options.keep && given.length) {
    for (const line of given) {
      const pair = line.split(';', 1)[0] ?? ''
      const at = pair.indexOf('=')
      if (at > 0) {
        const name = pair.slice(0, at).trim()
        if (!NOT_KEPT.has(name)) jar.set(name, pair.slice(at + 1).trim())
      }
    }
    ;(await cookies()).set(JAR, Buffer.from(JSON.stringify(Object.fromEntries(jar))).toString('base64url'), {
      httpOnly: true,
      sameSite: 'lax',
      secure: (incoming.get('x-forwarded-proto') ?? 'http') === 'https',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  }

  let data: T | null = null
  try {
    data = (await response.json()) as T
  } catch {}

  return { status: response.status, data }
}

/**
 * A form's fields as the site's routes take them: names of letters, digits, `_` and `-` (the
 * honeypot's random field, `cf-turnstile-response`, `wp-comment-cookies-consent`), plain values.
 */
export function formFields(form: unknown): Record<string, string | number | boolean> {
  if (!form || typeof form !== 'object') return {}
  return Object.fromEntries(
    Object.entries(form as Record<string, unknown>).filter(([key, value]) =>
      /^[A-Za-z0-9_-]{1,64}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof value)),
  ) as Record<string, string | number | boolean>
}

/** The site's answer handed on as it is, body and status — a 4xx with its messages included. */
export function answer<T>(result: SiteAnswer<T>): Response {
  return Response.json(result.data ?? { message: 'The site did not answer.' }, { status: result.data ? result.status : 502 })
}
