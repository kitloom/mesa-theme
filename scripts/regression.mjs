#!/usr/bin/env node
/**
 * The theme's regression run, over HTTP against a running theme (`npm run dev` or a build):
 * every kind of page drawn on the server, then a guest's cart and order, an account made,
 * signed in, ordered with and signed out of, a comment and a review — what a visitor does,
 * through the theme's own routes, with the theme's session cookie as a browser keeps it.
 *
 *   npm run regression                         # the theme at http://localhost:3088
 *   THEME_URL=https://shop.example.com npm run regression
 *   npm run regression -- --no-writes          # pages only: no order, account, comment or review
 *
 * It writes to the site it points at (orders, an account, comments, a review): run it against a
 * sandbox or a staging copy, not a live shop. Comments and reviews are sent only when the site's
 * Turnstile is off or uses Cloudflare's always-pass test key; otherwise they are skipped.
 */

const BASE = (process.env.THEME_URL ?? 'http://localhost:3088').replace(/\/$/, '')
const WRITES = !process.argv.includes('--no-writes')
const TEST_SITE_KEY = '1x00000000000000000000AA'

let failed = 0
let passed = 0
let skipped = 0

const ok = (name, condition, detail = '') => {
  if (condition) { passed++; console.log(`  ✓ ${name}`) }
  else { failed++; console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`) }
  return condition
}
const skip = (name, why) => { skipped++; console.log(`  - ${name} (skipped: ${why})`) }
const section = (title) => console.log(`\n${title}`)

/** A visitor: the theme's cookies kept between requests, as a browser keeps them. */
function visitor() {
  const jar = new Map()

  const request = async (path, { method = 'GET', body, accept } = {}) => {
    const response = await fetch(BASE + path, {
      method,
      redirect: 'manual',
      headers: {
        ...(jar.size ? { Cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; ') } : {}),
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(accept ? { Accept: accept } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
    for (const line of response.headers.getSetCookie?.() ?? []) {
      const pair = line.split(';', 1)[0]
      const at = pair.indexOf('=')
      if (at > 0) jar.set(pair.slice(0, at), pair.slice(at + 1))
    }
    const text = await response.text()
    let json = null
    try { json = JSON.parse(text) } catch {}
    return { status: response.status, text, json }
  }

  return {
    page: async (path) => (await request(`/api/page?path=${encodeURIComponent(path)}`)).json,
    html: (path) => request(path, { accept: 'text/html' }),
    post: (path, body) => request(path, { method: 'POST', body }),
    get: (path) => request(path),
  }
}

const shortcode = (page, name) => Object.values(page?.shortcodes && !Array.isArray(page.shortcodes) ? page.shortcodes : {}).find(s => s.shortcode === name) ?? null
const pathOf = (url, site) => (url?.startsWith(site) ? url.slice(site.length) || '/' : url)

function protectionFields(protection, { forTurnstile = true } = {}) {
  const fields = {}
  if (protection?.honeypot) {
    fields[protection.honeypot.nameFieldName] = ''
    fields[protection.honeypot.validFromFieldName] = protection.honeypot.encryptedValidFrom
  }
  if (protection?.turnstile && forTurnstile) fields['cf-turnstile-response'] = 'XXXX.DUMMY.TOKEN.XXXX'
  return fields
}
const canSendForms = (protection) => !protection?.turnstile || protection.turnstile.siteKey === TEST_SITE_KEY
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
// The honeypot refuses a form sent sooner than a second after the page that drew it.
const asAPerson = () => wait(1500)

async function checkout(v, site, { email, first = 'Regression', last = 'Visitor' }) {
  const page = await v.page('/checkout/')
  const form = shortcode(page, 'woocommerce_checkout')
  const country = form?.old?.billing_country || 'US'
  const states = form?.states?.[country] ?? null
  const state = form?.old?.billing_state || (states ? Object.keys(states)[0] : '')
  const rate = form?.cart?.shippingRates?.find(r => r.chosen)?.id ?? form?.cart?.shippingRates?.[0]?.id ?? ''
  const gateway = form?.gateways?.[0]?.id ?? ''
  const order = {
    billing_first_name: first, billing_last_name: last, billing_country: country, billing_state: state,
    billing_address_1: '1 Regression Road', billing_city: 'Portland', billing_postcode: '97201',
    billing_phone: '2075550199', billing_email: email, shipping_method: rate, payment_method: gateway,
    ...(form?.terms ? { terms: '1' } : {}),
  }
  return { form, placed: await v.post('/api/checkout', order) }
}

async function main() {
  console.log(`Theme: ${BASE}${WRITES ? '' : ' (no writes)'}`)
  const guest = visitor()

  // ── Pages ────────────────────────────────────────────────────────────────
  section('Pages drawn on the server')
  const home = await guest.page('/')
  if (!ok('the site answers through the theme', home?.kind, 'no page from /api/page')) return finish()
  const site = home.site.url.replace(/\/$/, '')
  const shop = await guest.page(pathOf(home.store?.shop, site) ?? '/shop/')
  const product = shop?.catalog?.products?.data?.find(p => p.purchasable && p.inStock && p.type === 'simple')
  const category = shop?.catalog?.categories?.[0]
  const journal = Object.values(home.menus ?? {}).flatMap(m => m.items).find(i => /journal|blog/i.test(i.title))
  const blog = journal ? await guest.page(pathOf(journal.url, site)) : null
  const post = blog?.posts?.items?.[0]
  const french = home.languages?.languages?.find(l => !l.current && l.translated)

  const pages = [
    ['front page', '/', 200, home.content?.title],
    ['shop', pathOf(home.store?.shop, site), 200, 'Shop'],
    category && ['product category', pathOf(category.link, site), 200, category.name],
    product && ['product', pathOf(product.link, site), 200, product.title],
    journal && ['journal', pathOf(journal.url, site), 200, journal.title],
    post && ['post', pathOf(post.link, site), 200, post.title],
    ['search', '/?s=almond', 200, 'Results for'],
    french && [`another language (${french.slug})`, pathOf(french.url, site), 200, null],
    ['cart', pathOf(home.cart?.url, site), 200, 'Cart'],
    ['checkout', pathOf(home.cart?.checkoutUrl, site), 200, null],
    ['account', pathOf(home.store?.account, site), 200, 'Sign in'],
    ['not found', '/no-such-page-for-the-regression/', 404, 'Only sand out here'],
  ].filter(Boolean)

  for (const [name, path, status, marker] of pages) {
    const { status: got, text } = await guest.html(path)
    const escaped = marker?.replace(/&/g, '&amp;')
    ok(`${name} ${path} → ${status}${marker ? `, "${marker}"` : ''}`,
      got === status && (!marker || text.includes(marker) || text.includes(escaped)) && !text.includes('nuxt-error'),
      `status ${got}${marker && !text.includes(marker) && !text.includes(escaped) ? `, "${marker}" not on the page` : ''}`)
  }

  const head = await guest.html('/')
  ok('the head: title, description, canonical on the theme, JSON-LD',
    /<title>[^<]+<\/title>/.test(head.text) && head.text.includes('name="description"') && head.text.includes(`rel="canonical" href="${BASE}/`) && head.text.includes('application/ld+json'))
  ok('links of the site are the theme’s paths', !head.text.includes(`href="${site}/shop/"`), 'a link still points at the site')

  if (!WRITES) return finish()
  if (!product) { ok('a simple product in stock to order', false); return finish() }

  // ── A guest's cart and order ────────────────────────────────────────────
  section('A guest: cart and order')
  let r = await guest.post('/api/cart/add', { product_id: product.id, quantity: 1 })
  ok('add to cart → 1 item', r.status === 200 && r.json?.cart?.count === 1, `status ${r.status}, count ${r.json?.cart?.count}`)
  const line = r.json?.cart?.lines?.[0]
  r = await guest.post('/api/cart/update', { quantities: { [line?.key]: 3 } })
  ok('change the quantity → 3', r.json?.cart?.count === 3, `count ${r.json?.cart?.count}`)
  r = await guest.post('/api/cart/remove', { key: line?.key })
  ok('remove the line → empty', r.json?.cart?.isEmpty === true)
  await guest.post('/api/cart/add', { product_id: product.id, quantity: 2 })
  ok('the header count on the next page', (await guest.page('/'))?.cart?.count === 2)
  ok('the cart page draws the lines', (await guest.html(pathOf(home.cart.url, site))).text.includes(product.title))

  r = await guest.post('/api/checkout', { payment_method: 'none' })
  ok('an empty checkout → 400 with a message per field', r.status === 400 && Object.keys(r.json?.data?.params ?? {}).length > 3, `status ${r.status}`)

  const { placed } = await checkout(guest, site, { email: `regression-guest-${Date.now()}@example.test` })
  ok('place the order → 201', placed.status === 201 && placed.json?.redirect?.includes('order-received'), `status ${placed.status} ${placed.text.slice(0, 160)}`)
  const receipt = await guest.page(pathOf(placed.json?.redirect, site))
  ok('the receipt is the theme’s, with the order', shortcode(receipt, 'woocommerce_checkout')?.view === 'received' && shortcode(receipt, 'woocommerce_checkout')?.order?.items?.length > 0)
  ok('the cart is empty after the order', (await guest.page('/'))?.cart?.count === 0)
  ok('the cart page says so', (await guest.html(pathOf(home.cart.url, site))).text.includes('Your cart is empty'))

  // ── An account ───────────────────────────────────────────────────────────
  section('A customer: sign up, order, account, sign out')
  const customer = visitor()
  const email = `regression-${Date.now()}@example.test`
  const password = `Harvest-${Date.now()}-Pass!`
  const account = shortcode(await customer.page(pathOf(home.store.account, site)), 'woocommerce_my_account')
  if (account?.urls?.register) {
    r = await customer.post('/api/account/register', { name: 'Regression Customer', email, password, password_confirmation: password })
    ok('sign up → 201', r.status === 201, `status ${r.status} ${r.text.slice(0, 160)}`)
  } else skip('sign up', 'the site takes no sign-ups on the account page')

  const signedIn = (await customer.page('/'))?.store?.signedIn === true
  ok('signed in on every page after it', signedIn)
  r = await customer.post('/api/account/logout', {})
  ok('sign out', r.status === 200 && (await customer.page('/'))?.store?.signedIn === false)
  r = await customer.post('/api/account/login', { email, password: 'wrong-password' })
  ok('a wrong password → 422', r.status === 422, `status ${r.status}`)
  r = await customer.post('/api/account/login', { email, password, remember: true })
  ok('sign in again', r.status === 200 && (await customer.page('/'))?.store?.signedIn === true, `status ${r.status}`)

  await customer.post('/api/cart/add', { product_id: product.id, quantity: 1 })
  const { placed: mine } = await checkout(customer, site, { email, first: 'Regression', last: 'Customer' })
  ok('order as the customer → 201', mine.status === 201, `status ${mine.status} ${mine.text.slice(0, 160)}`)
  const after = await customer.page(pathOf(home.store.account, site))
  ok('still signed in after the order', after?.store?.signedIn === true)
  ok('the cart is empty after the order', after?.cart?.count === 0)
  const dashboard = shortcode(after, 'woocommerce_my_account')
  ok('the account shows the order', dashboard?.view === 'dashboard' && dashboard.recent?.some(o => String(o.id) === String(mine.json?.order)))
  // With an empty cart the checkout page is the cart: the form needs something to order.
  r = await customer.post('/api/cart/add', { product_id: product.id, quantity: 1 })
  const remembered = shortcode(await customer.page(pathOf(home.cart.checkoutUrl, site)), 'woocommerce_checkout')
  ok('the next checkout starts from the saved address', remembered?.old?.billing_address_1 === '1 Regression Road', `old: ${JSON.stringify(remembered?.old ?? null).slice(0, 120)}`)
  await customer.post('/api/cart/remove', { key: r.json?.cart?.lines?.[0]?.key })

  // ── Comments and reviews ─────────────────────────────────────────────────
  section('Comments and reviews')
  const postPage = post ? await guest.page(pathOf(post.link, site)) : null
  const commentForm = postPage?.comments?.form
  if (!commentForm || !postPage.comments.open) skip('comments', 'no post with comments open')
  else if (!canSendForms(commentForm.protection)) skip('comments', 'the site’s Turnstile needs a real visitor')
  else {
    await asAPerson()
    const base = { post: commentForm.postId, parent: 0, content: `A regression comment from the Nuxt theme, ${new Date().toISOString()}.`, author_email: `regression-${Date.now()}@example.test` }
    r = await guest.post('/api/comments', { ...base, author_name: '', ...protectionFields(commentForm.protection) })
    ok('a comment without a name → 400 on the field', r.status === 400 && r.json?.data?.params?.author_name, `status ${r.status}`)
    r = await guest.post('/api/comments', { ...base, author_name: 'Regression' })
    ok('a comment without the spam fields → refused', r.status === 403, `status ${r.status}`)
    r = await guest.post('/api/comments', { ...base, author_name: 'Regression', ...protectionFields(commentForm.protection) })
    ok('a guest’s comment → 201', r.status === 201 && ['approved', 'hold'].includes(r.json?.status), `status ${r.status} ${r.text.slice(0, 160)}`)
    const parent = postPage.comments.items.find(c => c.canReply)
    if (parent) {
      const replyForm = (await customer.page(pathOf(post.link, site)))?.comments?.form
      await asAPerson()
      r = await customer.post('/api/comments', { post: commentForm.postId, parent: parent.id, content: `A regression reply, ${new Date().toISOString()}.`, ...protectionFields(replyForm?.protection) })
      ok('a customer’s reply → 201, under its comment', r.status === 201 && r.json?.comment?.parentId === parent.id, `status ${r.status} ${r.text.slice(0, 160)}`)
    }
  }

  const productPage = await customer.page(pathOf(product.link, site))
  const reviewForm = productPage?.product?.reviewForm
  if (!productPage?.product?.reviewsAllowed || !reviewForm) skip('reviews', 'the product takes no reviews')
  else if (!canSendForms(reviewForm.protection)) skip('reviews', 'the site’s Turnstile needs a real visitor')
  else {
    // A review is a comment to the site's flood rule: one per visitor every few seconds.
    await wait(16000)
    r = await customer.post('/api/reviews', { product: product.id, rating: 0, review: '', ...protectionFields(reviewForm.protection) })
    ok('a review without stars → 400 on the fields', r.status === 400 && r.json?.data?.params?.rating, `status ${r.status}`)
    r = await customer.post('/api/reviews', { product: product.id, rating: 5, review: `A regression review from the Nuxt theme, ${new Date().toISOString()}.`, ...protectionFields(reviewForm.protection) })
    ok('a customer’s review → 201', r.status === 201 && ['approved', 'hold'].includes(r.json?.review?.status), `status ${r.status} ${r.text.slice(0, 160)}`)
  }

  r = await customer.post('/api/account/logout', {})
  ok('sign out at the end', (await customer.page('/'))?.store?.signedIn === false)

  return finish()
}

function finish() {
  console.log(`\n${passed} passed, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`)
  process.exitCode = failed ? 1 : 0
}

main().catch((error) => {
  console.error(`\nThe run stopped: ${error.message}`)
  process.exitCode = 1
})
