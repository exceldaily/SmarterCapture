import Stripe from "stripe";
import { Pool } from "pg";

let stripeClient: Stripe | undefined;
let ordersPool: Pool | undefined;

export function getCommerceReadiness() {
  const checks = [
    { key: "APP_URL", label: "Canonical site URL", configured: Boolean(process.env.APP_URL) },
    { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", configured: Boolean(process.env.STRIPE_SECRET_KEY) },
    { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook signing secret", configured: Boolean(process.env.STRIPE_WEBHOOK_SECRET) },
    { key: "DATABASE_URL", label: "Order database connection", configured: Boolean(process.env.DATABASE_URL) },
  ];

  return { checks, ready: checks.every((check) => check.configured) };
}

export function getCanonicalAppUrl() {
  const rawUrl = process.env.APP_URL;
  if (!rawUrl) throw new Error("APP_URL is not configured.");
  const url = new URL(rawUrl);
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (url.protocol !== "https:" && !(isLocal && url.protocol === "http:")) {
    throw new Error("APP_URL must use HTTPS outside local development.");
  }
  return url.origin;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY is not configured.");
  stripeClient ??= new Stripe(secretKey, { maxNetworkRetries: 2 });
  return stripeClient;
}

export function getStripeWebhookSecret() {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not configured.");
  return secret;
}

/**
 * Order storage connects straight to Postgres as `smartercapture_app`, a
 * dedicated role scoped to the `smartercapture` schema of the shared
 * OrbitStack database. Deliberately not the Supabase REST layer:
 *
 * - The role can only reach this app's schema, so a leaked credential cannot
 *   touch the other apps sharing the project — and there is no platform-wide
 *   service key in this deployment at all.
 * - No Supabase Auth anywhere near this app: sign-ins would land in the same
 *   user pool as WanderBites, which shares the project. This site is
 *   account-free by design.
 * - DATABASE_URL must point at the IPv4 connection pooler
 *   (aws-0-<region>.pooler.supabase.com:6543); the direct db host is
 *   IPv6-only, which serverless functions cannot reach.
 */
export function getOrdersDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  ordersPool ??= new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 3, // serverless: keep per-instance connections minimal
    idleTimeoutMillis: 10_000,
  });
  return ordersPool;
}
