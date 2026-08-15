import { NextResponse } from "next/server";
import { assessAccessoryLaunch } from "@/lib/accessories/commerce";
import { getCanonicalAppUrl, getCommerceReadiness, getStripeClient } from "@/lib/accessories/server-config";

export const runtime = "nodejs";

function rejectCrossSiteRequest(request: Request) {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

export async function POST(request: Request) {
  if (rejectCrossSiteRequest(request)) {
    return NextResponse.json({ error: "Cross-site checkout requests are not accepted." }, { status: 403 });
  }

  const readiness = getCommerceReadiness();
  if (!readiness.ready) {
    return NextResponse.json({ error: "Checkout is not connected yet." }, { status: 503 });
  }

  const appUrl = getCanonicalAppUrl();
  if (request.headers.get("origin") !== appUrl) {
    return NextResponse.json({ error: "Checkout must begin on the Smarter Capture site." }, { status: 403 });
  }

  const formData = await request.formData();
  const productId = formData.get("productId");
  const quantityValue = formData.get("quantity");
  const quantity = typeof quantityValue === "string" ? Number.parseInt(quantityValue, 10) : 1;

  if (typeof productId !== "string" || quantity !== 1) {
    return NextResponse.json({ error: "This checkout currently supports one approved item at a time." }, { status: 400 });
  }

  const launch = assessAccessoryLaunch(productId);
  if (!launch.purchasable || !launch.product || !launch.sourcing || !launch.policy) {
    return NextResponse.json(
      { error: "This accessory is not available for checkout.", blockers: launch.blockers },
      { status: 409 },
    );
  }

  const primarySupplier = launch.sourcing.candidates.find((candidate) => candidate.role === "primary");
  if (!primarySupplier || launch.product.retailPriceUsd === null || launch.sourcing.estimatedLandedCostUsd === null) {
    return NextResponse.json({ error: "The approved supplier snapshot is incomplete." }, { status: 409 });
  }

  const unitAmountCents = Math.round(launch.product.retailPriceUsd * 100);
  const shippingAmountCents = Math.round(launch.policy.flatShippingUsd * 100);
  const supplierEstimatedCostCents = Math.round(launch.sourcing.estimatedLandedCostUsd * 100);
  const expectedProfitCents = unitAmountCents + shippingAmountCents - supplierEstimatedCostCents;
  const stripe = getStripeClient();

  const metadata = {
    order_type: "smarter_capture_accessory",
    product_id: launch.product.id,
    product_slug: launch.product.slug,
    product_name: launch.product.name,
    quantity: String(quantity),
    unit_amount_cents: String(unitAmountCents),
    supplier_name: primarySupplier.supplierName,
    supplier_product_url: primarySupplier.alibabaProductUrl,
    supplier_variant: launch.policy.approvedSupplierVariant,
    supplier_estimated_cost_cents: String(supplierEstimatedCostCents),
    expected_profit_cents: String(expectedProfitCents),
  };

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_creation: "always",
    payment_method_types: ["card"],
    phone_number_collection: { enabled: true },
    shipping_address_collection: { allowed_countries: launch.policy.allowedCountries },
    shipping_options: [{
      shipping_rate_data: {
        type: "fixed_amount",
        display_name: "Verified international delivery",
        fixed_amount: { amount: shippingAmountCents, currency: "usd" },
        delivery_estimate: {
          minimum: { unit: "business_day", value: launch.policy.deliveryBusinessDays.minimum },
          maximum: { unit: "business_day", value: launch.policy.deliveryBusinessDays.maximum },
        },
      },
    }],
    line_items: [{
      quantity,
      price_data: {
        currency: "usd",
        unit_amount: unitAmountCents,
        product_data: {
          name: launch.product.name,
          description: launch.product.description,
          metadata: { product_id: launch.product.id },
        },
      },
    }],
    metadata,
    payment_intent_data: { metadata },
    success_url: `${appUrl}/gear/${launch.product.slug}?checkout=success`,
    cancel_url: `${appUrl}/gear/${launch.product.slug}?checkout=cancelled`,
    custom_text: {
      shipping_address: { message: "Use an address that can receive tracked international parcels." },
      submit: { message: "The delivery range shown here is based on the supplier route verified for your destination." },
    },
  });

  if (!session.url) return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  return NextResponse.redirect(session.url, 303);
}
