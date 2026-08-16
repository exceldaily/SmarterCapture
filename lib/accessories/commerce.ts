import { accessoryProducts } from "./catalog";
import { getSourcingRecord } from "./sourcing";

export interface AccessoryLaunchPolicy {
  productId: string;
  flatShippingUsd: number;
  allowedCountries: Array<"US" | "TH" | "CA" | "GB" | "AU" | "DE">;
  deliveryBusinessDays: { minimum: number; maximum: number };
  approvedSupplierVariant: string;
}

// Policies below were approved by the owner on 2026-08-16. Shipping is
// absorbed into each retail price (flat $0 at checkout), US-only for launch,
// with a 10-25 business-day window reflecting the manual Alibaba route.
// The owner explicitly waived pre-launch physical samples for this supplier.
export const accessoryLaunchPolicies: Partial<Record<string, AccessoryLaunchPolicy>> = {
  "magnetic-quick-release-base": {
    productId: "magnetic-quick-release-base",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "Default colour, dual-interface base",
  },
  "folding-selfie-tripod": {
    productId: "folding-selfie-tripod",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "Default colour",
  },
  "suction-cup-mount": {
    productId: "suction-cup-mount",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "For Go Pro (1/4-20 screw) variant",
  },
  "backpack-strap-clip": {
    productId: "backpack-strap-clip",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "For DJI Osmo Action 3/4/5 Pro variant",
  },
  "pocket-lens-cover": {
    productId: "pocket-lens-cover",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "For DJI Pocket 4P variant",
  },
  "wrist-lanyard": {
    productId: "wrist-lanyard",
    flatShippingUsd: 0,
    allowedCountries: ["US"],
    deliveryBusinessDays: { minimum: 10, maximum: 25 },
    approvedSupplierVariant: "Default colour",
  },
};

export function assessAccessoryLaunch(productId: string) {
  const product = accessoryProducts.find((item) => item.id === productId);
  const sourcing = product ? getSourcingRecord(product.id) : undefined;
  const policy = product ? accessoryLaunchPolicies[product.id] : undefined;
  const blockers: string[] = [];

  if (!product) blockers.push("Product does not exist in the approved catalog.");
  if (product?.catalogStatus !== "ready") blockers.push("Catalog status is not ready.");
  if (product?.retailPriceUsd === null || (product?.retailPriceUsd ?? 0) <= 0) blockers.push("Retail price is not approved.");
  if (!sourcing) blockers.push("Supplier sourcing record is missing.");
  if (sourcing?.verificationStatus !== "source-checked") blockers.push("Supplier record is not fully source-checked.");
  if (!sourcing?.shippingLastVerified) blockers.push("Destination shipping has not been verified.");
  if (sourcing?.imageUsageStatus !== "APPROVED_FOR_USE") blockers.push("Product image usage is not approved.");
  if (sourcing?.estimatedLandedCostUsd === null) blockers.push("Landed cost is not calculated.");
  if (sourcing && !["GOOD_MARGIN", "ACCEPTABLE_MARGIN"].includes(sourcing.marginStatus)) blockers.push("Margin has not been approved.");
  if (sourcing?.estimatedProfitUsd === null || (sourcing?.estimatedProfitUsd ?? 0) <= 0) blockers.push("Expected profit is not approved.");
  if (sourcing && sourcing.recommendedRetailPriceUsd !== product?.retailPriceUsd) blockers.push("Catalog and sourcing prices do not match.");
  if (sourcing && sourcing.blockers.length > 0) blockers.push("The sourcing record still has launch blockers.");
  if (!policy) blockers.push("No approved launch shipping policy exists.");

  return { product, sourcing, policy, blockers, purchasable: blockers.length === 0 };
}
