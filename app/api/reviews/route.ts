import { answer, formFields, siteFetch } from '@/lib/site'

/** A review of a product — the shop's `products/{id}/reviews`, as the visitor. */
export async function POST(request: Request) {
  const { product, ...form } = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const id = Number(product)

  if (!Number.isInteger(id) || id < 1) {
    return Response.json({ message: 'A product is expected.' }, { status: 400 })
  }

  return answer(await siteFetch(`/wp-json/wc/store/v1/products/${id}/reviews`, { method: 'POST', keep: true, body: formFields(form) }))
}
