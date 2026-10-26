import { answer, siteFetch } from '@/lib/site'

/** Takes a line out of the cart by its key. */
export async function POST(request: Request) {
  const key = String(((await request.json().catch(() => ({}))) as { key?: string }).key ?? '')

  if (!/^[\w-]+$/.test(key)) {
    return Response.json({ message: 'A line key is expected.' }, { status: 400 })
  }

  return answer(await siteFetch(`/wp-json/wc/store/v1/cart/remove-item/${key}`, { method: 'POST', keep: true }))
}
