import { answer, formFields, siteFetch } from '@/lib/site'

/**
 * "Place order": the form goes to the site as it is. The site validates it against its own fields
 * and rules and answers 201 with the order and where to go next, or 400 with a message per field.
 */
export async function POST(request: Request) {
  return answer(await siteFetch('/wp-json/wc/store/v1/checkout', { method: 'POST', keep: true, body: formFields(await request.json().catch(() => ({}))) }))
}
