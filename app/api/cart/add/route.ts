import { answer, siteFetch } from '@/lib/site'

/** Puts a product into the visitor's cart on the site; the site answers with the cart and a notice. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { product_id?: number; quantity?: number; variation_id?: number }

  return answer(await siteFetch('/wp-json/wc/store/v1/cart/add-item', {
    method: 'POST',
    keep: true,
    body: {
      product_id: Number(body.product_id),
      quantity: Math.max(1, Number(body.quantity ?? 1)),
      ...(body.variation_id ? { variation_id: Number(body.variation_id) } : {}),
    },
  }))
}
