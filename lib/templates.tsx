import type { ComponentType } from 'react'
import type { Page } from './types'
import { shortcode } from './page'
import { FrontPage } from '@/templates/FrontPage'
import { Archive } from '@/templates/Archive'
import { Single } from '@/templates/Single'
import { Catalog } from '@/templates/Catalog'
import { SingleProduct } from '@/templates/SingleProduct'
import { Cart } from '@/templates/Cart'
import { Checkout } from '@/templates/Checkout'
import { Account } from '@/templates/Account'

export type TemplateProps = { page: Page; path: string }

/**
 * WordPress's template hierarchy, decided by the site: the page says `front-page`, `single`,
 * `archive`, `search`… and the theme picks the component. A part the page carries (a product,
 * a catalog, the shop's cart, checkout or account) wins over the template's name.
 */
export function resolveTemplate(page: Page): ComponentType<TemplateProps> {
  if (page.product) return SingleProduct
  if (page.catalog) return Catalog
  if (shortcode(page, 'woocommerce_cart')) return Cart
  if (shortcode(page, 'woocommerce_checkout')) return Checkout
  if (shortcode(page, 'woocommerce_my_account')) return Account
  if (page.template === 'front-page') return FrontPage
  if (page.posts) return Archive
  return Single
}
