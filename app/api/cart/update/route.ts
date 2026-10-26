import { answer, siteFetch } from '@/lib/site'

/** New quantities by line key; zero removes the line. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { quantities?: Record<string, number> }
  return answer(await siteFetch('/wp-json/wc/store/v1/cart/update-items', { method: 'POST', keep: true, body: { quantities: body.quantities ?? {} } }))
}
