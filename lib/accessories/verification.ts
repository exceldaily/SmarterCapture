import { accessoryProducts } from "./catalog";
import { accessorySourcingRecords } from "./sourcing";

export const launchMarkets = [
  { country: "United States", code: "US", testDestination: "Miami, FL 33101" },
  { country: "Thailand", code: "TH", testDestination: "Bangkok 10110" },
  { country: "Canada", code: "CA", testDestination: "Toronto, ON M5V 3L9" },
  { country: "United Kingdom", code: "GB", testDestination: "London SW1A 1AA" },
  { country: "Australia", code: "AU", testDestination: "Sydney, NSW 2000" },
  { country: "Germany", code: "DE", testDestination: "Berlin 10115" },
] as const;

type SamplePriority = "HIGH" | "MEDIUM" | "DEFER";

const samplePriority: Record<string, { priority: SamplePriority; reason: string }> = {
  "suction-cup-mount": {
    priority: "HIGH",
    reason: "A failed suction mount can damage a camera or create a road hazard; retention and surface tests are mandatory.",
  },
  "handlebar-pole-clamp": {
    priority: "HIGH",
    reason: "Clamp strength, vibration resistance and thread quality need physical testing before vehicle use.",
  },
  "floating-camera-grip": {
    priority: "HIGH",
    reason: "Buoyancy must be tested with representative camera weights, not inferred from the listing.",
  },
  "universal-adapter-kit": {
    priority: "MEDIUM",
    reason: "Fit, thread quality and buckle tolerances determine whether the kit is genuinely useful across camera systems.",
  },
  "aluminum-extension-pole": {
    priority: "MEDIUM",
    reason: "Locking sections, flex and the exact supplied adapter need a hands-on check.",
  },
  "quick-release-chest-strap": {
    priority: "DEFER",
    reason: "The MOQ is above the current one-order validation model; first confirm a true sample or dropship route.",
  },
  "backpack-strap-clip": {
    priority: "DEFER",
    reason: "The MOQ is above the current one-order validation model; first confirm a true sample or dropship route.",
  },
  "safety-tether-kit": {
    priority: "DEFER",
    reason: "MOQ 100 makes this a bulk-only candidate until a one-piece alternative is sourced.",
  },
  "flexible-mini-tripod": {
    priority: "DEFER",
    reason: "Confirm a sample path and load rating before spending against the MOQ 10 listing.",
  },
  "adjustable-head-strap": {
    priority: "DEFER",
    reason: "Resolve the compatibility conflict and erroneous displayed sample price before ordering anything.",
  },
};

const priorityRank: Record<SamplePriority, number> = { HIGH: 0, MEDIUM: 1, DEFER: 2 };

export const accessorySampleQueue = accessorySourcingRecords
  .map((record) => {
    const product = accessoryProducts.find((item) => item.id === record.productId);
    const supplier = record.candidates.find((item) => item.role === "primary");
    const decision = samplePriority[record.productId];
    if (!product || !supplier || !decision) return null;
    return { product, record, supplier, ...decision };
  })
  .filter((item): item is NonNullable<typeof item> => item !== null)
  .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);

export function buildSupplierInquiry(productId: string) {
  const product = accessoryProducts.find((item) => item.id === productId);
  const record = accessorySourcingRecords.find((item) => item.productId === productId);
  const supplier = record?.candidates.find((item) => item.role === "primary");
  if (!product || !record || !supplier) return "";

  const destinations = launchMarkets
    .map((market) => `- ${market.country}: ${market.testDestination}`)
    .join("\n");

  return `Hello,

I am evaluating your ${product.name} (Alibaba product ID ${supplier.supplierProductId}) for a small action-camera accessory store. We will begin with individual customer orders and may buy in bulk later if demand is consistent.

Please confirm the following for the exact variant shown in this listing:

1. The exact price for one complete unit, including every item in the advertised set.
2. Whether I can order one sample now and whether you support one-piece dropshipping after approval.
3. The one-unit shipping price, shipping method, dispatch time, delivery estimate and tracking availability for each test destination:
${destinations}
4. Whether you can ship directly to my customer using neutral packaging with no supplier invoice, price or promotional insert.
5. The exact included adapter, mount standard, compatible camera systems, materials, dimensions and weight.
6. Your process for damaged, defective, missing or lost individual shipments.
7. Whether I have written permission to use your product photos and specifications on my retail website. Please identify any approved reseller asset folder.
8. Whether the same SKU and construction will remain consistent between samples, individual orders and later bulk orders.
9. Current pricing tiers for 1, 10, 25, 50 and 100 units, including packaging or logo options for later bulk orders.

Please answer each item separately. I will not publish shipping, compatibility or delivery claims until they are confirmed in writing.

Thank you.`;
}
