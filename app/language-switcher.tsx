"use client";

// Compact language select for the site header, gear header and mobile nav.
// Shows each locale's own name (English, Español, Français, Deutsch,
// Português, 日本語, ไทย). Styling lives in app/globals.css (.lang-switcher).

import { Globe } from "lucide-react";
import { localeNames, locales, type Locale } from "@/lib/i18n";
import { useLocale } from "@/app/locale-provider";

export function LanguageSwitcher({ variant = "header" }: { variant?: "header" | "mobile" }) {
  const { locale, setLocale } = useLocale();
  return (
    <label className={`lang-switcher ${variant}`}>
      <Globe size={variant === "mobile" ? 20 : 14} aria-hidden="true" />
      {variant === "mobile" && <span>{locale.toUpperCase()}</span>}
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => setLocale(event.target.value as Locale)}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNames[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
