import { answer, siteFetch } from '@/lib/site'

/** The shipping rate the visitor picked. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { shipping_method?: string }
  return answer(await siteFetch('/wp-json/wc/store/v1/cart/select-shipping-rate', { method: 'POST', keep: true, body: { shipping_method: String(body.shipping_method ?? '') } }))
}
