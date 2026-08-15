import { accessoryProducts } from "./catalog";
import { getSourcingRecord } from "./sourcing";

export interface AccessoryLaunchPolicy {
  productId: string;
  flatShippingUsd: number;
  allowedCountries: Array<"US" | "TH" | "CA" | "GB" | "AU" | "DE">;
  deliveryBusinessDays: { minimum: number; maximum: number };
  approvedSupplierVariant: string;
}

// Add a policy here only after the destination quotes, delivery range and
// physical sample have been approved. An empty map is the final checkout gate.
export const accessoryLaunchPolicies: Partial<Record<string, AccessoryLaunchPolicy>> = {};

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
