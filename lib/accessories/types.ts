export type AccessoryCategory =
  | "pov"
  | "water"
  | "travel"
  | "vehicle"
  | "sports"
  | "everyday"
  | "mounts";

export type CatalogStatus = "researching" | "future-bulk" | "ready" | "paused";
export type FulfillmentMode =
  | "MANUAL_ALIBABA"
  | "DROPSHIP_SUPPLIER"
  | "IN_HOUSE_INVENTORY"
  | "THIRD_PARTY_FULFILLMENT";

export type VerificationStatus = "source-checked" | "needs-confirmation" | "conflicting-source" | "stale";

export interface AccessoryProduct {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  category: AccessoryCategory;
  useCases: string[];
  universal: boolean;
  mountStandard: string;
  brandsSupported: string[];
  compatibilityNote: string;
  includedItems: string[];
  warnings: string[];
  material: string | null;
  retailPriceUsd: number | null;
  catalogStatus: CatalogStatus;
  fulfillmentMode: FulfillmentMode;
  recommendationSceneIds: string[];
  recommendationMounts: string[];
  recommendationReason: string;
}

export interface PricingTier {
  quantity: string;
  price: string;
}

export interface SupplierCandidate {
  role: "primary" | "alternative";
  supplierName: string;
  supplierCountry: string;
  supplierUrl: string | null;
  alibabaProductUrl: string;
  supplierProductId: string;
  supplierYearsActive: number | null;
  supplierRating: string | null;
  supplierVerified: boolean | null;
  tradeAssurance: boolean | null;
  displayedPrice: string;
  actualOneUnitPrice: string | null;
  samplePrice: string | null;
  currency: string;
  moq: number;
  pricingTiers: PricingTier[];
  shippingFinding: string;
  deliveryFinding: string;
  dropshippingSupported: boolean | null;
  sampleSupported: boolean | null;
  trackingAvailable: boolean | null;
  sourceNotes: string[];
}

export interface MarketComparison {
  label: string;
  observedPrice: string;
  sourceUrl: string;
  checkedAt: string;
}

export interface AccessorySourcingRecord {
  productId: string;
  verificationStatus: VerificationStatus;
  lastVerified: string;
  supplierPriceLastVerified: string;
  shippingLastVerified: string | null;
  availabilityLastVerified: string;
  imageUsageStatus: "NEEDS_APPROVAL" | "APPROVED_FOR_USE";
  candidates: SupplierCandidate[];
  marketComparisons: MarketComparison[];
  estimatedLandedCostUsd: number | null;
  recommendedRetailPriceUsd: number | null;
  estimatedProfitUsd: number | null;
  estimatedMarginPercent: number | null;
  marginStatus: "GOOD_MARGIN" | "ACCEPTABLE_MARGIN" | "POOR_MARGIN" | "NOT_CALCULATED";
  bulkOpportunity: string;
  selectionReason: string;
  blockers: string[];
}

export type AccessoryOrderStatus =
  | "NEW"
  | "PAID"
  | "NEEDS_ORDERING"
  | "ORDERED_FROM_SUPPLIER"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUND_REQUESTED"
  | "REFUNDED"
  | "SUPPLIER_ISSUE";

export interface AccessoryOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  email: string;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    stateOrProvince?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  items: Array<{ productId: string; quantity: number; unitPriceUsd: number }>;
  shippingChargedUsd: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  fulfillmentStatus: AccessoryOrderStatus;
  supplierName: string;
  alibabaProductUrl: string;
  supplierVariant: string | null;
  supplierEstimatedCostUsd: number | null;
  expectedProfitUsd: number | null;
  supplierOrderNumber: string | null;
  actualProductCostUsd: number | null;
  actualShippingCostUsd: number | null;
  expectedDelivery: string | null;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  notes: string[];
  createdAt: string;
}
