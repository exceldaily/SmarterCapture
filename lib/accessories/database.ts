import { getOrdersDb } from "./server-config";

export interface CheckoutOrderInput {
  stripeEventId: string;
  stripeSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  shippingAddress: {
    line1: string;
    line2: string | null;
    city: string;
    stateOrProvince: string | null;
    postalCode: string;
    country: string;
  };
  currency: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  productId: string;
  productSlug: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  supplierName: string;
  supplierProductUrl: string;
  supplierVariant: string;
  supplierEstimatedCostCents: number | null;
  expectedProfitCents: number | null;
}

export interface AdminAccessoryOrder {
  id: string;
  order_number: string;
  stripe_session_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: CheckoutOrderInput["shippingAddress"];
  currency: string;
  subtotal_cents: number;
  shipping_charged_cents: number;
  total_cents: number;
  payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillment_status: string;
  supplier_order_number: string | null;
  actual_product_cost_cents: number | null;
  actual_shipping_cost_cents: number | null;
  expected_delivery: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string[];
  created_at: string;
  updated_at: string;
  accessory_order_items: Array<{
    product_id: string;
    product_slug: string;
    product_name: string;
    quantity: number;
    unit_price_cents: number;
    supplier_name: string;
    supplier_product_url: string;
    supplier_variant: string;
    supplier_estimated_cost_cents: number | null;
    expected_profit_cents: number | null;
  }>;
}

/**
 * Records a paid order through the database's atomic, idempotent function.
 * Replaying the same Stripe event or session is a no-op by design.
 */
export async function recordPaidAccessoryOrder(input: CheckoutOrderInput) {
  const db = getOrdersDb();
  const { rows } = await db.query<{ order_id: string; order_number: string }>(
    `select order_id, order_number
       from smartercapture.record_accessory_checkout_order(
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
         $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
       )`,
    [
      input.stripeEventId,
      input.stripeSessionId,
      input.stripePaymentIntentId,
      input.customerEmail,
      input.customerName,
      input.customerPhone,
      JSON.stringify(input.shippingAddress),
      input.currency,
      input.subtotalCents,
      input.shippingCents,
      input.totalCents,
      input.productId,
      input.productSlug,
      input.productName,
      input.quantity,
      input.unitPriceCents,
      input.supplierName,
      input.supplierProductUrl,
      input.supplierVariant,
      input.supplierEstimatedCostCents,
      input.expectedProfitCents,
    ],
  );
  if (!rows[0]) throw new Error("Could not record paid accessory order: no row returned.");
  return rows[0];
}

export async function listAccessoryOrders(limit = 50) {
  const db = getOrdersDb();
  const capped = Math.min(Math.max(limit, 1), 100);
  const { rows } = await db.query(
    `select o.*,
            coalesce(
              (select json_agg(json_build_object(
                 'product_id', i.product_id,
                 'product_slug', i.product_slug,
                 'product_name', i.product_name,
                 'quantity', i.quantity,
                 'unit_price_cents', i.unit_price_cents,
                 'supplier_name', i.supplier_name,
                 'supplier_product_url', i.supplier_product_url,
                 'supplier_variant', i.supplier_variant,
                 'supplier_estimated_cost_cents', i.supplier_estimated_cost_cents,
                 'expected_profit_cents', i.expected_profit_cents
               ) order by i.created_at)
               from smartercapture.accessory_order_items i
               where i.order_id = o.id),
              '[]'::json
            ) as accessory_order_items
       from smartercapture.accessory_orders o
      order by o.created_at desc
      limit $1`,
    [capped],
  );
  return rows as AdminAccessoryOrder[];
}
