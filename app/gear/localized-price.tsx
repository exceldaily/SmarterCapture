"use client";

// Client leaf so server-rendered gear pages can show the browsing locale's
// currency. Non-USD amounts are "≈" estimates; USD is what checkout charges,
// so the exact USD figure is always shown alongside a conversion.

import { formatPrice, localeCurrency } from "@/lib/i18n/currency";
import { useLocale } from "@/app/locale-provider";

export function LocalizedPrice({ usd }: { usd: number }) {
  const { locale } = useLocale();
  const currency = localeCurrency[locale];
  if (currency === "USD") return <>{formatPrice(usd, "USD", locale)}</>;
  return (
    <>
      {formatPrice(usd, currency, locale)}
      <em className="price-usd">({formatPrice(usd, "USD", "en")} USD)</em>
    </>
  );
}
