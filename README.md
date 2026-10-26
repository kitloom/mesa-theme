# Mesa — a Next.js theme for a kitloom site

A headless storefront in desert colours — sand, terracotta, the sun and sage by day, a dusk-blue
sky at night — on Next.js 16 and React 19. It draws any [kitloom](https://kitloom.dev) site, a
Laravel CMS on a WordPress database, without touching the site: every address is read as JSON and
drawn by React Server Components. Its sibling on Nuxt is
[Harvest](https://github.com/kitloom/harvest-theme); the two answer the same routes and pass the
same regression run.

```bash
cp .env.example .env     # the site to draw; the default is a public sandbox
npm install
npm run dev              # http://localhost:3088
```

Node 20.9 or later. `npm run build` + `npm start` for production.

## Connect your own site

1. **The address.** `NEXT_PUBLIC_SITE_URL=https://shop.example.com` in `.env`. The theme's server
   reads the site — the browser never talks to it — so a private address works as long as the
   server can reach it. Every kitloom site answers `Accept: application/json` with the page as
   data; nothing is switched on for the pages.
2. **The shop.** The cart, the checkout and the account need kitloom/shop with its Store API routes
   (`kitloom-shop.routes.register`, the default) and its Shop, Cart, Checkout and My account pages
   set. Without the shop the theme draws the posts, pages, archives and search.
3. **Who may order** — the shop's settings → Accounts: orders without an account, an account made
   during checkout, sign-up on the "My account" page (WooCommerce's own options; a site that came
   from WooCommerce keeps what it had).
4. **How to pay and how to ship.** A payment method on and a shipping zone with a rate.
5. **Comments and reviews** carry the site's spam protection (kitloom/forms' honeypot and
   Cloudflare Turnstile). With Turnstile on, add the theme's hostname to the widget in Cloudflare.
6. **The visitor's address.** The theme's server sends it in `X-Forwarded-For`; the site reads it
   only from proxies it trusts — set `TRUSTED_PROXIES` in the site's `.env` to the theme server's
   address, or every visitor shares one address for the site's limits (five comments a minute).

No CORS, no API keys, no public AI agents address.

## How it works

| Piece | File | What it does |
| --- | --- | --- |
| Route | `app/[[...slug]]/page.tsx` | Every address; a Server Component that reads the site's page and picks a template |
| Site client | `lib/site.ts` | Reads `<site><path>` as JSON with the visitor's cookies, `Origin` and address |
| Page | `lib/page.ts` | `getPage()` under React's `cache()`: metadata, page and 404 of one request share one read |
| Hierarchy | `lib/templates.tsx` | `front-page`, `single`, `archive`, `search`… and the parts a page carries → a template |
| Head | `lib/metadata.ts` | `generateMetadata` from the site's SEO head, canonical and alternates on the theme's origin |
| Proxy | `proxy.ts` | Adds the trailing slash to the site's addresses, hands the path to the layout and the 404 |
| 404 | `app/not-found.tsx` | `notFound()` keeps the 404 status; the boundary draws the site's frame from the cached page |
| API | `app/api/*/route.ts` | The cart, checkout, account, comments and reviews — the site's routes, as the visitor |

The header and the footer are drawn inside the page, not the layout: a layout stays from one page
to the next, and the menus, the language, the cart count and "signed in" change with the page.
Interactive parts are Client Components that call the theme's routes and then `router.refresh()`:
the server draws the page again — the header's count is the site's after every change, never a
copy kept in the browser. Cache Components are off on purpose: every page here is the visitor's.

## The visitor's session

The cart, the checkout and the account are the site's own — its Store API
(`/wp-json/wc/store/v1/*`) and sign-in routes. A Route Handler keeps the cookies the site gave the
visitor in one `httpOnly` cookie of the theme (`kitloom_site`) and sends them with every request,
naming the site as the `Origin` so its forgery check passes as for its own forms. Server Components
read the cookie; only Route Handlers write it, the one place Next lets a response set cookies.

| Route | Site |
| --- | --- |
| `GET /api/page?path=` | the page as JSON |
| `GET /api/cart`, `POST /api/cart/add`, `/update`, `/remove`, `/customer`, `/shipping` | `cart`, `cart/add-item`, … |
| `POST /api/checkout` | `checkout` |
| `POST /api/account/login`, `/logout`, `/lost-password`, `/register`, `/details`, `/address` | `/login`, `/logout`, `account/*` |
| `POST /api/comments`, `/api/reviews` | `comments/v1/comments`, `products/{id}/reviews` |

The checkout form is the site's: the fields, countries, states, delivery rates and payment
methods its checkout page hands over; "Place order" answers where to go next, or a message per
field. "Order received" and every view of the account are pages of the site, drawn by the theme.

## Regression

```bash
npm run regression                              # against http://localhost:3088
THEME_URL=https://shop.example.com npm run regression
npm run regression -- --no-writes               # pages only
```

The same `scripts/regression.mjs` as Harvest's: every kind of page drawn on the server, a guest's
cart and order, an account signed up, out and in, an order as the customer, a comment, a reply
and a review. It writes to the site it points at — run it against a sandbox.

## Palette

Sand `#f6eedf`, dune `#ecdcc2`, umber `#2c2420`, terracotta `#c2552f`, sun `#e3a23a`, sage
`#7f8f62`, clay rose `#c9826f`, dusk `#33395c`; at night the sky `#171826`. CSS variables in
`app/globals.css`. Type: DM Serif Display for headings, Work Sans for text, through `next/font`.

License: MIT. kitloom itself is a paid product; see [kitloom.dev](https://kitloom.dev).
