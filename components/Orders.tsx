import Link from 'next/link'
import { toPath } from '@/lib/links'
import type { Order, OrderRow } from '@/lib/types'

export function OrderFacts({ order }: { order: Order }) {
  return (
    <div className="facts">
      <div><small>Order</small><strong>#{order.number}</strong></div>
      <div><small>Date</small><strong>{order.date}</strong></div>
      <div><small>Status</small><strong>{order.statusLabel}</strong></div>
      <div><small>Payment</small><strong>{order.paymentMethodTitle}</strong></div>
      <div><small>Total</small><strong className="total">{order.totalFormatted}</strong></div>
    </div>
  )
}

export function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="order-columns">
      <div className="card order-items">
        <h2>What you ordered</h2>
        <ul>
          {order.items.map(item => (
            <li key={`${item.productId}-${item.variation ?? ''}`}>
              <span><Link href={toPath(item.link)}>{item.name}</Link>{item.variation && <small> · {item.variation}</small>}<small> × {item.quantity}</small></span>
              <strong>{item.totalFormatted}</strong>
            </li>
          ))}
        </ul>
        <dl className="totals">
          <dt>Subtotal</dt><dd>{order.subtotalFormatted}</dd>
          {order.needsShipping && <><dt>{order.shippingLabel || 'Delivery'}</dt><dd>{order.shippingFormatted}</dd></>}
          <dt className="grand">Total</dt><dd className="grand">{order.totalFormatted}</dd>
        </dl>
      </div>
      <div className="order-addresses">
        <div className="card">
          <h2>Billing</h2>
          {order.billing.map(line => <p key={line}>{line}</p>)}
          {order.phone && <p>{order.phone}</p>}
          <p>{order.email}</p>
        </div>
        {order.needsShipping && (
          <div className="card">
            <h2>Delivery</h2>
            {order.shipping.map(line => <p key={line}>{line}</p>)}
          </div>
        )}
        {order.customerNote && <p className="card note"><strong>Your note:</strong> {order.customerNote}</p>}
      </div>
    </div>
  )
}

export function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="card table-wrap">
      <table className="orders">
        <thead><tr><th>Order</th><th>Date</th><th>Status</th><th>Total</th><th><span className="visually-hidden">Actions</span></th></tr></thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id}>
              <td><Link href={toPath(order.link)} className="number">#{order.number}</Link></td>
              <td>{order.date}</td>
              <td><span className={`status ${order.status}`}>{order.statusLabel}</span></td>
              <td>{order.totalFormatted} <small>for {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}</small></td>
              <td className="actions">
                {order.urls.pay && <a href={order.urls.pay} className="button small">Pay</a>}
                <Link href={toPath(order.link)} className="button ghost small">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
