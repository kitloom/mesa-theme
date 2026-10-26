import { NextResponse, type NextRequest } from 'next/server'

/**
 * Before a page is drawn: the site's addresses get their trailing slash (as WordPress redirects
 * `/shop` to `/shop/`), and the address goes to the render as a request header — the not-found
 * boundary and the root layout get no route params, and both draw from the site's page there.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (!pathname.endsWith('/') && !/\/[^/]+\.\w+$/.test(pathname)) {
    // A plain URL: NextURL formats the path by its own trailing slash rules.
    return NextResponse.redirect(new URL(`${pathname}/${request.nextUrl.search}`, request.url), 308)
  }

  const url = request.nextUrl.clone()
  url.searchParams.delete('_rsc')
  const forwarded = new Headers(request.headers)
  forwarded.set('x-theme-path', url.pathname + url.search)
  return NextResponse.next({ request: { headers: forwarded } })
}

export const config = {
  matcher: ['/((?!_next/|api/|favicon\\.svg).*)'],
}
