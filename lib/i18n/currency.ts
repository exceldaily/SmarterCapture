// Multi-currency DISPLAY for Smarter Capture.
//
// USD is the only checkout currency: catalog prices are stored in USD and
// Stripe Checkout charges in USD (Stripe's own checkout page handles any
// buyer-local presentation/conversion on its side). Everything non-USD here
// is a courtesy estimate for browsing, which is why formatPrice prefixes
// converted amounts with "≈".

import { intlLocales, type Locale } from "./index";

export type CurrencyCode = "USD" | "EUR" | "JPY" | "THB";

/** Default display currency per locale. */
export const localeCurrency: Record<Locale, CurrencyCode> = {
  en: "USD",
  es: "EUR",
  fr: "EUR",
  de: "EUR",
  pt: "EUR",
  ja: "JPY",
  th: "THB",
};

// Static fallback FX table — APPROXIMATE MID-AUGUST 2026 RATES, hand-entered.
// These are display-only ballparks (no live FX feed in v1); refresh them if
// they drift far, and never use them for actual billing math.
const USD_TO: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.86,
  JPY: 147,
  THB: 32.5,
};

/**
 * Format a USD amount for display in the given currency. Non-USD output is
 * prefixed with "≈" because it is a converted estimate, not the charge
 * amount. Intl.NumberFormat handles symbols and decimals (JPY gets 0).
 */
export function formatPrice(usd: number, currency: CurrencyCode, locale: Locale = "en"): string {
  const amount = usd * USD_TO[currency];
  const formatted = new Intl.NumberFormat(intlLocales[locale], {
    style: "currency",
    currency,
  }).format(amount);
  return currency === "USD" ? formatted : `≈ ${formatted}`;
}
