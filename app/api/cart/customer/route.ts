import { answer, siteFetch } from '@/lib/site'

type Address = { country?: string; state?: string; postcode?: string; city?: string }

const address = (given: Address | undefined) => given && {
  country: String(given.country ?? '').slice(0, 2),
  state: String(given.state ?? '').slice(0, 100),
  postcode: String(given.postcode ?? '').slice(0, 20),
  city: String(given.city ?? '').slice(0, 100),
}

/** The addresses the cart is priced for: the shipping rates come back with the cart. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { shipping_address?: Address; billing_address?: Address }

  return answer(await siteFetch('/wp-json/wc/store/v1/cart/update-customer', {
    method: 'POST',
    keep: true,
    body: { shipping_address: address(body.shipping_address), billing_address: address(body.billing_address) },
  }))
}
