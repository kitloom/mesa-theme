import { answer, formFields, siteFetch } from '@/lib/site'

/** The site's own forms of a visitor's account: sign in and out, sign up, a lost password, details, addresses. */
const ROUTES: Record<string, string> = {
  'login': '/login',
  'logout': '/logout',
  'lost-password': '/lost-password',
  'register': '/wp-json/wc/store/v1/account/register',
  'details': '/wp-json/wc/store/v1/account/details',
  'address': '/wp-json/wc/store/v1/account/address',
}

export async function POST(request: Request, { params }: { params: Promise<{ action: string }> }) {
  const route = ROUTES[(await params).action]

  if (!route) {
    return Response.json({ message: 'No such form.' }, { status: 404 })
  }

  return answer(await siteFetch(route, { method: 'POST', keep: true, body: formFields(await request.json().catch(() => ({}))) }))
}
