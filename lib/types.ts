/**
 * The shape of a kitloom page read as JSON: `GET <url>` with `Accept: application/json`.
 * Only what this theme draws is typed; the site sends more.
 */

export interface Author { id: number; name: string; slug: string; link: string }

export interface Thumbnail { id: number; url: string; alt: string; width: number; height: number }

export interface Term { id: number; name: string; slug: string; link: string }

export interface Entry {
  kind: string
  id: number | null
  type: string | null
  slug: string | null
  title: string
  link: string
  content?: string
  excerpt: string
  date: string | null
  formattedDate: string | null
  author: Author | null
  thumbnail: Thumbnail | null
  terms: Record<string, Term[]> | Term[]
  parent?: number | null
  count?: number | null
}

export interface Pagination {
  page: number
  pages: number
  perPage: number
  total: number
  next: string | null
  previous: string | null
}

export interface MenuItem {
  id: number
  title: string
  url: string
  target: string
  children: MenuItem[]
}

export interface Menu { name: string; items: MenuItem[] }

export interface Widget { id: string; type: string; title: string; content: string }

export interface Breadcrumb { title: string; url: string }

export interface Language { slug: string; name: string; locale: string; url: string; current: boolean; translated: boolean }

export interface Head {
  title: string
  description: string
  robots: string
  canonical: string
  openGraph: Record<string, string>
  twitter: Record<string, string>
  alternates: Record<string, string>
}

export interface CommentAuthor { name: string; url: string | null; initials: string; isPostAuthor: boolean }

export interface Comment {
  id: number
  parentId: number
  depth: number
  link: string
  dateText: string
  author: CommentAuthor
  paragraphs: string[]
  status: 'approved' | 'hold' | string
  canReply: boolean
  children: Comment[]
}

export interface Protection {
  honeypot?: { nameFieldName: string; validFromFieldName: string; encryptedValidFrom: string } | null
  turnstile?: { siteKey: string } | null
}

/** The comment form of a record, as the site would draw it for this visitor. */
export interface CommentFormData {
  postId: number
  mustLogIn: boolean
  loginUrl: string | null
  loggedInAs: { name: string } | null
  logoutUrl: string | null
  requireNameEmail: boolean
  cookiesOptIn: boolean
  author: { name: string; email: string; url: string }
  protection: Protection
  maxLengths?: Record<string, number>
}

export interface Comments {
  open: boolean
  closedReason: string | null
  count: number
  threaded: boolean
  maxDepth: number
  items: Comment[]
  page: number
  pages: number
  prevUrl: string | null
  nextUrl: string | null
  form: CommentFormData | null
  notice: { type: string; message: string } | null
}

export interface Product {
  id: number
  title: string
  link: string
  sku: string
  price: number
  priceFormatted: string
  regularPriceFormatted: string
  onSale: boolean
  discount: number | null
  inStock: boolean
  stockStatus: string
  rating: number
  reviewCount: number
  featured: boolean
  image: string | null
  category: { name: string; link: string } | null
  purchasable: boolean
  type: 'simple' | 'variable' | 'grouped' | 'external' | string
  maxQuantity?: number
}

export interface Review { id: number; author: string; dateText: string; rating: number; verified: boolean; content: string; replies?: { id: number; author: string; dateText: string; content: string }[] }

export interface ProductDetail extends Product {
  shortDescription: string
  gallery: { full: string; thumb: string; alt: string }[]
  categories: { id: number; name: string; link: string }[]
  tags: { id: number; name: string; link: string }[]
  attributes: { name: string; label: string; values: string[] }[]
  reviews: { items: Review[]; total: number }
  ratingCounts: Record<string, number>
  related: Product[]
  upsells: Product[]
  reviewsAllowed: boolean
  reviewForm: { requireNameEmail: boolean; verifiedOnly: boolean; mustLogIn: boolean; protection: Protection } | null
}

export interface ProductCategory {
  id: number
  name: string
  slug: string
  link: string
  description: string
  image: string | null
  count: number
}

export interface Catalog {
  products: {
    data: Product[]
    current_page: number
    last_page: number
    total: number
    next_page_url: string | null
    prev_page_url: string | null
    links: { url: string | null; label: string; page: number | null; active: boolean }[]
  }
  orderBy: string
  orders: Record<string, string>
  basePath: string
  category: ProductCategory | null
  categories: ProductCategory[]
}

export interface Shortcode {
  shortcode: string
  arguments: Record<string, string> | []
  items?: unknown[]
  cart?: Cart
}

export interface CartLine {
  key: string
  product: Product
  variation: { title?: string } | null
  variationId: number
  quantity: number
  maxQuantity: number
  priceFormatted: string
  subtotalFormatted: string
  totalFormatted: string
}

export interface ShippingRate { id: string; label: string; costFormatted: string; chosen: boolean }

export interface Cart {
  isEmpty: boolean
  count: number
  lines: CartLine[]
  subtotalFormatted: string
  discountTotalFormatted: string
  needsShipping: boolean
  shippingRates: ShippingRate[]
  shippingTotalFormatted: string
  untilFreeShippingFormatted: string | null
  taxTotalFormatted: string
  totalFormatted: string
}

export interface CartResponse { cart: Cart; message?: string }

export interface Storefront {
  button: { label: string; url: string }
  benefits: { heading: string; items: { icon: string; title: string; text: string }[] }
}

export interface Page {
  kind: string
  template: string
  url: string
  content?: Entry
  posts?: { items: Entry[]; pagination: Pagination }
  comments?: Comments
  breadcrumbs?: Breadcrumb[]
  widgets?: Record<string, Widget[]>
  site?: { name: string; description: string; url: string; language: string }
  languages?: { current: string; languages: Language[] }
  menus?: Record<string, Menu>
  menuLocations?: Record<string, string>
  store?: { shop: string; account: string; signedIn: boolean }
  cart?: { count: number; url: string; checkoutUrl: string }
  head?: Head
  schema?: unknown
  catalog?: Catalog
  product?: ProductDetail
  shortcodes?: Record<string, Shortcode> | []
  storefront?: Storefront
}

export interface CheckoutField {
  label: string
  required: boolean
  type: 'text' | 'email' | 'tel' | 'country' | 'state'
  wide: boolean
  autocomplete: string
}

export interface Gateway { id: string; title: string; description: string }

export interface OrderItem {
  name: string
  productId: number
  link: string
  quantity: number
  totalFormatted: string
  variation: string | null
  purchaseNote: string
}

export interface Order {
  id: number
  number: string
  date: string
  status: string
  statusLabel: string
  email: string
  customer: string
  paymentMethod: string
  paymentMethodTitle: string
  isPaid: boolean
  customerNote: string
  items: OrderItem[]
  subtotalFormatted: string
  needsShipping: boolean
  shippingLabel: string
  shippingFormatted: string
  discountFormatted: string
  taxTotalFormatted: string
  totalFormatted: string
  billing: string[]
  shipping: string[]
  phone: string
  urls: { pay: string | null; cancel: string | null }
}

/** The `[woocommerce_checkout]` part: the form as the shop configured it, or the order received. */
export interface CheckoutData {
  shortcode: 'woocommerce_checkout'
  view: 'form' | 'received' | 'pay' | 'login'
  cart?: Cart
  fields?: Record<string, CheckoutField>
  shippingFields?: Record<string, CheckoutField>
  countries?: Record<string, string>
  shippingCountries?: Record<string, string>
  states?: Record<string, Record<string, string>>
  statesOptional?: string[]
  addressLabels?: Record<string, { state: string; postcode: string }>
  shipToDifferentAddress?: boolean
  terms?: { title: string; url: string } | null
  account?: { required: boolean; password: boolean } | null
  gateways?: Gateway[]
  old?: Record<string, string>
  errors?: Record<string, string[]>
  order?: Order
  paymentInstructions?: string
  bankDetails?: Record<string, string>[]
  message?: string | null
  urls?: Record<string, string | null>
}

export interface PlacedOrder { order: number | string; payment: string | null; redirect: string }

export interface OrderRow {
  id: number
  number: string
  date: string
  status: string
  statusLabel: string
  itemCount: number
  totalFormatted: string
  link: string
  urls: { pay: string | null; cancel: string | null }
  documents: { label: string; url: string }[]
}

/** The `[woocommerce_my_account]` part: the sign-in page, or one view of the signed-in customer's account. */
export interface AccountData {
  shortcode: 'woocommerce_my_account'
  view: 'login' | 'dashboard' | 'orders' | 'order' | 'addresses' | 'address' | 'details'
  customer?: { name: string }
  urls: Record<string, string | null>
  reset?: { login: string; key: string } | null
  recent?: OrderRow[]
  orders?: OrderRow[]
  pagination?: { page: number; pages: number; next: string | null; previous: string | null }
  order?: Order
  addresses?: Record<'billing' | 'shipping', { title: string; lines: string[]; edit: string }>
  type?: 'billing' | 'shipping'
  title?: string
  fields?: Record<string, CheckoutField>
  countries?: Record<string, string>
  states?: Record<string, Record<string, string>>
  statesOptional?: string[]
  addressLabels?: Record<string, { state: string; postcode: string }>
  values?: Record<string, string>
  errors?: Record<string, string[]>
}
