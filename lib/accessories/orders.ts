import type { AccessoryOrderStatus } from "./types";

export const accessoryOrderStatuses: AccessoryOrderStatus[] = [
  "NEW",
  "PAID",
  "NEEDS_ORDERING",
  "ORDERED_FROM_SUPPLIER",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUND_REQUESTED",
  "REFUNDED",
  "SUPPLIER_ISSUE",
];

export const manualFulfillmentSteps = [
  "Verify payment and the customer address before copying any details.",
  "Open the exact supplier listing stored on the order and confirm price, variant, MOQ and destination shipping again.",
  "Place the supplier order manually and record the Alibaba order number plus actual product and shipping costs.",
  "When tracking arrives, record the carrier, tracking number and tracking URL, then notify the customer.",
  "Close the order only after delivery is confirmed; record refunds and supplier issues against the same order.",
];

// Deliberately no browser-storage order implementation. Real orders require a
// server-side database, authenticated admin access and verified payment webhooks.
