import type { MetadataRoute } from "next";
import { SITE } from "@/lib/gateway/core";

// Crawler strategy (deliberate, per-purpose):
// - Ordinary search indexing: allowed (Googlebot, Bingbot, everyone default).
// - AI *search* indexing (answers that cite us): allowed — OAI-SearchBot,
//   PerplexityBot — because being a cited source is the point of the gateway.
// - Model TRAINING crawlers: disallowed by default (GPTBot, Google-Extended,
//   CCBot, Bytespider). Granting training rights is an owner decision to make
//   explicitly, not a side effect; flip a block here to opt in.
// - User-triggered browsing agents (ChatGPT-User, Claude-User) act on behalf
//   of a human and are not blocked.
// Private surfaces (admin, checkout API, internal styleguide) are excluded
// for every crawler and never appear in the sitemap.
const PRIVATE = ["/admin/", "/api/accessories/", "/api/stripe/", "/styleguide"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "GPTBot", disallow: "/" },
      { userAgent: "Google-Extended", disallow: "/" },
      { userAgent: "CCBot", disallow: "/" },
      { userAgent: "Bytespider", disallow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
      { userAgent: "*", allow: "/", disallow: PRIVATE },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  };
}
