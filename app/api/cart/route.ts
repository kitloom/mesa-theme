import { answer, siteFetch } from '@/lib/site'

/** The visitor's cart on the site. */
export async function GET() {
  return answer(await siteFetch('/wp-json/wc/store/v1/cart', { keep: true }))
}
