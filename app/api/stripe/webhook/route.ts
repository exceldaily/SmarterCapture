import type Stripe from "stripe";
import { accessoryProducts } from "@/lib/accessories/catalog";
import { recordPaidAccessoryOrder } from "@/lib/accessories/database";
import { getSourcingRecord } from "@/lib/accessories/sourcing";
import { getStripeClient, getStripeWebhookSecret } from "@/lib/accessories/server-config";

export const runtime = "nodejs";

function parseCents(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) return null;
  return Number.parseInt(value, 10);
}

function paymentIntentId(value: string | Stripe.PaymentIntent | null) {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

async function recordSession(event: Stripe.Event, session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  if (session.metadata?.order_type !== "smarter_capture_accessory") return;

  const productId = session.metadata.product_id;
  const product = accessoryProducts.find((item) => item.id === productId);
  const sourcing = product ? getSourcingRecord(product.id) : undefined;
  const primarySupplier = sourcing?.candidates.find((candidate) => candidate.role === "primary");
  const shipping = session.collected_information?.shipping_details;
  const address = shipping?.address;
  const quantity = parseCents(session.metadata.quantity);
  const unitPriceCents = parseCents(session.metadata.unit_amount_cents);

  if (!product || !primarySupplier || !shipping || !address || !quantity || unitPriceCents === null) {
    throw new Error(`Paid checkout ${session.id} is missing its approved order snapshot.`);
  }
  if (session.amount_subtotal !== unitPriceCents * quantity) {
    throw new Error(`Paid checkout ${session.id} does not match its server-created price snapshot.`);
  }

  await recordPaidAccessoryOrder({
    stripeEventId: event.id,
    stripeSessionId: session.id,
    stripePaymentIntentId: paymentIntentId(session.payment_intent),
    customerEmail: session.customer_details?.email ?? "",
    customerName: shipping.name,
    customerPhone: session.customer_details?.phone ?? null,
    shippingAddress: {
      line1: address.line1 ?? "",
      line2: address.line2 ?? null,
      city: address.city ?? "",
      stateOrProvince: address.state ?? null,
      postalCode: address.postal_code ?? "",
      country: address.country ?? "",
    },
    currency: session.currency ?? "usd",
    subtotalCents: session.amount_subtotal ?? 0,
    shippingCents: session.shipping_cost?.amount_total ?? 0,
    totalCents: session.amount_total ?? 0,
    productId: product.id,
    productSlug: product.slug,
    productName: session.metadata.product_name || product.name,
    quantity,
    unitPriceCents,
    supplierName: session.metadata.supplier_name || primarySupplier.supplierName,
    supplierProductUrl: session.metadata.supplier_product_url || primarySupplier.alibabaProductUrl,
    supplierVariant: session.metadata.supplier_variant || "Approved checkout variant",
    supplierEstimatedCostCents: parseCents(session.metadata.supplier_estimated_cost_cents),
    expectedProfitCents: parseCents(session.metadata.expected_profit_cents),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("Missing Stripe signature", { status: 400 });

  let event: Stripe.Event;
  try {
    event = await getStripeClient().webhooks.constructEventAsync(
      await request.text(),
      signature,
      getStripeWebhookSecret(),
    );
  } catch {
    return new Response("Invalid Stripe signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    await recordSession(event, event.data.object);
  }

  return Response.json({ received: true });
}
