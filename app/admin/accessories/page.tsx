import Link from "next/link";
import {
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  CreditCard,
  ExternalLink,
  PackageCheck,
  PackageSearch,
  ShieldCheck,
} from "lucide-react";
import { accessoryProducts } from "@/lib/accessories/catalog";
import { listAccessoryOrders, type AdminAccessoryOrder } from "@/lib/accessories/database";
import { manualFulfillmentSteps } from "@/lib/accessories/orders";
import { getCommerceReadiness } from "@/lib/accessories/server-config";
import { accessorySourcingRecords } from "@/lib/accessories/sourcing";
import { accessorySampleQueue, buildSupplierInquiry, launchMarkets } from "@/lib/accessories/verification";
import { CopyField } from "./copy-field";

export const dynamic = "force-dynamic";

function money(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(cents / 100);
}

function addressText(order: AdminAccessoryOrder) {
  const address = order.shipping_address;
  return [
    order.customer_name,
    address.line1,
    address.line2,
    [address.city, address.stateOrProvince, address.postalCode].filter(Boolean).join(", "),
    address.country,
    order.customer_phone,
  ].filter(Boolean).join("\n");
}

export default async function AccessoriesAdminPage() {
  const commerce = getCommerceReadiness();
  const databaseConnected = commerce.checks
    .filter((check) => check.key === "DATABASE_URL")
    .every((check) => check.configured);
  let orders: AdminAccessoryOrder[] | null = null;
  let orderLoadError: string | null = null;

  if (databaseConnected) {
    try {
      orders = await listAccessoryOrders();
    } catch (error) {
      orderLoadError = error instanceof Error ? error.message : "Orders could not be loaded.";
    }
  }

  const orderList = orders ?? [];
  const revenueCents = orderList.filter((order) => order.payment_status === "PAID").reduce((sum, order) => sum + order.total_cents, 0);
  const expectedCostCents = orderList.flatMap((order) => order.accessory_order_items).reduce((sum, item) => sum + (item.supplier_estimated_cost_cents ?? 0), 0);
  const expectedProfitCents = orderList.flatMap((order) => order.accessory_order_items).reduce((sum, item) => sum + (item.expected_profit_cents ?? 0), 0);
  const needsOrdering = orderList.filter((order) => order.fulfillment_status === "NEEDS_ORDERING").length;
  const awaitingTracking = orderList.filter((order) => order.fulfillment_status === "ORDERED_FROM_SUPPLIER").length;
  const delivered = orderList.filter((order) => order.fulfillment_status === "DELIVERED").length;

  return (
    <main className="admin-sourcing">
      <header>
        <span>SMARTER CAPTURE / INTERNAL</span>
        <h1>Accessory operations</h1>
        <p>Supplier evidence, verification work, payment readiness and manual order fulfillment in one protected workspace.</p>
      </header>

      <section className="admin-summary">
        <div><strong>{accessoryProducts.length}</strong><span>Products researched</span></div>
        <div><strong>{accessoryProducts.filter((item) => item.catalogStatus === "ready").length}</strong><span>Ready for checkout</span></div>
        <div><strong>{accessoryProducts.filter((item) => item.catalogStatus === "future-bulk").length}</strong><span>Future bulk only</span></div>
        <div><strong>{accessorySourcingRecords.filter((item) => item.shippingLastVerified === null).length}</strong><span>Need shipping checks</span></div>
      </section>

      <section className="admin-blocker">
        <CircleAlert size={22} />
        <div><strong>Checkout is still intentionally off.</strong><p>The order pipeline now has server-side price checks, signed payment events and persistent order storage, but no product has passed the one-unit shipping, image-rights, margin and sample gates. No charge can be created for an unapproved item.</p></div>
      </section>

      <section className="admin-operations-panel">
        <div className="admin-section-heading">
          <CreditCard size={22} />
          <div><small>PAYMENTS + ORDER STORAGE</small><h2>Connection readiness</h2><p>Secrets remain server-only. A missing connection keeps checkout closed.</p></div>
        </div>
        <div className="admin-config-checks">
          {commerce.checks.map((check) => (
            <p key={check.key} className={check.configured ? "configured" : "missing"}>
              {check.configured ? <CheckCircle2 size={15} /> : <CircleDashed size={15} />}
              <span>{check.label}</span><strong>{check.configured ? "Connected" : "Not connected"}</strong>
            </p>
          ))}
        </div>
      </section>

      <section className="admin-order-desk">
        <div className="admin-section-heading">
          <PackageCheck size={22} />
          <div><small>ACCESSORY ORDERS</small><h2>{orders ? `${orders.length} recorded orders` : "Waiting for database connection"}</h2><p>Only payments confirmed by a valid Stripe signature enter this queue.</p></div>
        </div>
        <div className="admin-order-metrics">
          <span><strong>{orders ? money(revenueCents) : "—"}</strong>Revenue</span>
          <span><strong>{orders ? money(expectedCostCents) : "—"}</strong>Estimated cost</span>
          <span><strong>{orders ? money(expectedProfitCents) : "—"}</strong>Expected profit</span>
          <span><strong>{orders ? needsOrdering : "—"}</strong>Needs ordering</span>
          <span><strong>{orders ? awaitingTracking : "—"}</strong>Awaiting tracking</span>
          <span><strong>{orders ? delivered : "—"}</strong>Delivered</span>
        </div>
        {orderLoadError && <p className="admin-order-error"><CircleAlert size={15} /> {orderLoadError}</p>}
        {orders?.length === 0 && <p className="admin-empty-orders">The connection is ready. No paid accessory orders have been recorded.</p>}
        <div className="admin-order-list">
          {orders?.map((order) => (
            <article className="admin-order" key={order.id}>
              <div className="admin-order-head">
                <span><small>{order.fulfillment_status.replaceAll("_", " ")}</small><h3>Order {order.order_number}</h3><p>{new Date(order.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p></span>
                <strong>{money(order.total_cents, order.currency)}</strong>
              </div>
              {order.accessory_order_items.map((item) => (
                <div className="admin-order-item" key={item.product_id}>
                  <div><strong>{item.product_name}</strong><span>Quantity {item.quantity} · Customer price {money(item.unit_price_cents, order.currency)}</span></div>
                  <a href={item.supplier_product_url} target="_blank" rel="noreferrer">Open exact supplier listing <ExternalLink size={13} /></a>
                </div>
              ))}
              <div className="admin-order-customer">
                <CopyField label="Customer delivery information" value={addressText(order)} rows={7} />
                <dl>
                  <div><dt>Email</dt><dd>{order.customer_email}</dd></div>
                  <div><dt>Payment</dt><dd>{order.payment_status}</dd></div>
                  <div><dt>Supplier order</dt><dd>{order.supplier_order_number ?? "Not placed"}</dd></div>
                  <div><dt>Tracking</dt><dd>{order.tracking_number ?? "Not received"}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-verification-desk">
        <div className="admin-section-heading">
          <PackageSearch size={22} />
          <div><small>SUPPLIER VERIFICATION</small><h2>Sample and message queue</h2><p>Prepared for {launchMarkets.map((market) => market.country).join(", ")}. Copying does not contact a supplier or place an order.</p></div>
        </div>
        <div className="admin-sample-queue">
          {accessorySampleQueue.map((item, index) => (
            <details key={item.product.id} className={`admin-sample-item ${item.priority.toLowerCase()}`} open={index === 0}>
              <summary>
                <span><i>{item.priority}</i><strong>{item.product.name}</strong><small>{item.supplier.supplierName}</small></span>
                <b>{item.supplier.moq === 1 ? "MOQ 1 candidate" : `MOQ ${item.supplier.moq}`}</b>
              </summary>
              <div className="admin-sample-body">
                <p>{item.reason}</p>
                <CopyField label="Supplier inquiry — review before sending" value={buildSupplierInquiry(item.product.id)} />
                <a href={item.supplier.alibabaProductUrl} target="_blank" rel="noreferrer">Open listing to contact supplier <ExternalLink size={13} /></a>
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="admin-records">
        {accessorySourcingRecords.map((record) => {
          const product = accessoryProducts.find((item) => item.id === record.productId);
          const primary = record.candidates.find((item) => item.role === "primary");
          if (!product || !primary) return null;
          return (
            <article className="admin-record" key={record.productId}>
              <div className="admin-record-head">
                <div><span>{product.category} · {record.verificationStatus.replaceAll("-", " ")}</span><h2>{product.name}</h2><p>{record.selectionReason}</p></div>
                <i className={product.catalogStatus}>{product.catalogStatus.replaceAll("-", " ")}</i>
              </div>
              <div className="admin-record-grid">
                <dl>
                  <div><dt>Supplier</dt><dd>{primary.supplierName}</dd></div>
                  <div><dt>Supplier history</dt><dd>{primary.supplierYearsActive ? `${primary.supplierYearsActive} years` : "Not shown"}</dd></div>
                  <div><dt>Supplier rating</dt><dd>{primary.supplierRating ?? "Not shown"}</dd></div>
                  <div><dt>MOQ</dt><dd>{primary.moq}</dd></div>
                  <div><dt>Displayed price</dt><dd>{primary.displayedPrice}</dd></div>
                  <div><dt>Actual one-unit price</dt><dd>{primary.actualOneUnitPrice ?? "Requires confirmation"}</dd></div>
                  <div><dt>Sample</dt><dd>{primary.samplePrice ?? (primary.sampleSupported ? "Supported; price not shown" : "Not confirmed")}</dd></div>
                  <div><dt>Shipping</dt><dd>{primary.shippingFinding}</dd></div>
                  <div><dt>Delivery</dt><dd>{primary.deliveryFinding}</dd></div>
                  <div><dt>Last checked</dt><dd>{record.lastVerified}</dd></div>
                </dl>
                <div className="admin-pricing">
                  <span>QUANTITY PRICING</span>
                  {primary.pricingTiers.map((tier) => <p key={`${tier.quantity}-${tier.price}`}><strong>{tier.quantity}</strong><b>{tier.price}</b></p>)}
                  <span>MARKET COMPARISONS</span>
                  {record.marketComparisons.length ? record.marketComparisons.map((comparison) => <p key={comparison.label}><strong>{comparison.label}</strong><b>{comparison.observedPrice}</b></p>) : <p><strong>No current comparison recorded</strong></p>}
                </div>
              </div>
              <div className="admin-economics">
                <span>Landed cost <strong>{record.estimatedLandedCostUsd === null ? "Not calculated" : `$${record.estimatedLandedCostUsd.toFixed(2)}`}</strong></span>
                <span>Retail <strong>{record.recommendedRetailPriceUsd === null ? "Not approved" : `$${record.recommendedRetailPriceUsd.toFixed(2)}`}</strong></span>
                <span>Margin <strong>{record.estimatedMarginPercent === null ? "Not calculated" : `${record.estimatedMarginPercent.toFixed(1)}%`}</strong></span>
                <span>Status <strong>{record.marginStatus.replaceAll("_", " ")}</strong></span>
              </div>
              <div className="admin-blockers"><span>LAUNCH BLOCKERS</span>{record.blockers.map((blocker) => <p key={blocker}><CircleAlert size={13} />{blocker}</p>)}</div>
              <div className="admin-record-foot">
                <p><strong>Bulk view:</strong> {record.bulkOpportunity}</p>
                <a href={primary.alibabaProductUrl} target="_blank" rel="noreferrer">Open supplier listing <ExternalLink size={14} /></a>
              </div>
            </article>
          );
        })}
      </div>

      <section className="admin-orders-ready">
        <div><PackageSearch size={22} /><span><small>ORDER OPERATIONS</small><h2>Manual fulfillment checklist</h2></span></div>
        <ol>{manualFulfillmentSteps.map((step) => <li key={step}>{step}</li>)}</ol>
        <p><ShieldCheck size={16} /> Supplier ordering stays manual; this system never buys inventory or submits customer details automatically.</p>
      </section>

      <p className="admin-home"><Link href="/gear">View customer Gear page</Link></p>
    </main>
  );
}
