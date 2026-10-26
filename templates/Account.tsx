import Link from 'next/link'
import { AddressForm, DetailsForm, SignInForms, SignOutButton } from '@/components/AccountForms'
import { Breadcrumbs } from '@/components/Bits'
import { HtmlContent } from '@/components/HtmlContent'
import { OrderDetails, OrderFacts, OrdersTable } from '@/components/Orders'
import { shortcode } from '@/lib/page'
import { toPath } from '@/lib/links'
import type { TemplateProps } from '@/lib/templates'
import type { AccountData } from '@/lib/types'

/**
 * The customer's account, from the site's account page: the sign-in and sign-up forms for a
 * visitor; for a customer the dashboard, the orders, one order, the addresses and the details.
 */
export function Account({ page }: TemplateProps) {
  const data = shortcode<AccountData>(page, 'woocommerce_my_account')
  const accountPath = toPath(page.store?.account ?? '/my-account/')

  if (!data) {
    return <div className="container section"><h1>{page.content?.title ?? 'My account'}</h1><HtmlContent html={page.content?.content} className="prose" /></div>
  }

  if (data.view === 'login') {
    return <div className="container section"><Breadcrumbs items={page.breadcrumbs} /><SignInForms key={page.url} data={data} accountPath={accountPath} /></div>
  }

  const urls = data.urls
  const view = data.view
  const nav = [
    { key: 'dashboard', label: 'Dashboard', to: urls.dashboard, active: view === 'dashboard' },
    { key: 'orders', label: 'Orders', to: urls.orders, active: view === 'orders' || view === 'order' },
    { key: 'address', label: 'Addresses', to: urls.address, active: view === 'addresses' || view === 'address' },
    { key: 'details', label: 'Account details', to: urls.details, active: view === 'details' },
  ].filter(item => item.to)
  const shop = toPath(urls.shop ?? '/shop/')

  return (
    <div className="container section">
      <Breadcrumbs items={page.breadcrumbs} />
      <div className="account">
        <aside className="side">
          <p className="eyebrow">My account</p>
          <h1 className="who-name">{data.customer?.name}</h1>
          <nav aria-label="Account">
            {nav.map(item => <Link key={item.key} href={toPath(item.to!)} className={`nav-item${item.active ? ' active' : ''}`}>{item.label}</Link>)}
            <SignOutButton />
          </nav>
        </aside>
        <section className="account-content">
          {view === 'dashboard' && (
            <>
              <h2>Hello, {data.customer?.name}.</h2>
              <p className="lede">From here you can see your recent orders, change your addresses and your details.</p>
              {data.recent?.length
                ? <><h3>Recent orders</h3><OrdersTable orders={data.recent} /></>
                : <p className="muted">No orders yet. <Link href={shop}>Have a look at the shop →</Link></p>}
            </>
          )}
          {view === 'orders' && (
            <>
              <h2>Orders</h2>
              {data.orders?.length ? <OrdersTable orders={data.orders} /> : <p className="muted">No orders yet. <Link href={shop}>Have a look at the shop →</Link></p>}
              {data.pagination && data.pagination.pages > 1 && (
                <nav className="pager">
                  {data.pagination.previous ? <Link href={toPath(data.pagination.previous)} className="button ghost small">← Newer</Link> : <span />}
                  <span className="muted">Page {data.pagination.page} of {data.pagination.pages}</span>
                  {data.pagination.next ? <Link href={toPath(data.pagination.next)} className="button ghost small">Older →</Link> : <span />}
                </nav>
              )}
            </>
          )}
          {view === 'order' && data.order && (
            <>
              <Link href={toPath(urls.orders ?? accountPath)} className="back-link">← All orders</Link>
              <h2>Order #{data.order.number}</h2>
              <OrderFacts order={data.order} />
              {(data.order.urls.pay || data.order.urls.cancel) && (
                <p className="form-actions">
                  {data.order.urls.pay && <a href={data.order.urls.pay} className="button">Pay for this order</a>}
                  {data.order.urls.cancel && <a href={data.order.urls.cancel} className="button ghost">Cancel</a>}
                </p>
              )}
              <OrderDetails order={data.order} />
            </>
          )}
          {view === 'addresses' && data.addresses && (
            <>
              <h2>Addresses</h2>
              <p className="lede">The addresses used by default on the checkout page.</p>
              <div className="address-cards">
                {Object.entries(data.addresses).map(([type, address]) => (
                  <div key={type} className="card address-card">
                    <h3>{address.title}</h3>
                    {address.lines.length ? address.lines.map(line => <p key={line}>{line}</p>) : <p className="muted">You have not set up this type of address yet.</p>}
                    <Link href={toPath(address.edit)} className="edit">{address.lines.length ? 'Edit' : 'Add'} →</Link>
                  </div>
                ))}
              </div>
            </>
          )}
          {view === 'address' && data.fields && (
            <>
              <Link href={toPath(urls.address ?? accountPath)} className="back-link">← Addresses</Link>
              <AddressForm key={page.url} data={data} />
            </>
          )}
          {view === 'details' && <DetailsForm key={page.url} data={data} />}
        </section>
      </div>
    </div>
  )
}
