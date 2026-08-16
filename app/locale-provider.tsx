"use client";

// Client-side locale context. The server (and hydration pass) always renders
// English via getServerSnapshot; the real locale (stored choice or browser
// language) is read lazily on the client, and React re-renders once after
// hydration if it differs, so server and client markup never mismatch.
// See lib/i18n/index.ts for the v1 scope decision on what is translated.

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  getInitialLocale,
  persistLocale,
  t,
  type DictionaryKey,
  type Locale,
  type Translator,
} from "@/lib/i18n";

/* Tiny module-level store so the locale survives across provider instances
   (main app and gear pages mount separate trees under the same layout). */

let currentLocale: Locale | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getLocaleSnapshot(): Locale {
  if (currentLocale === null) currentLocale = getInitialLocale();
  return currentLocale;
}

function getServerLocaleSnapshot(): Locale {
  return "en";
}

function setGlobalLocale(next: Locale) {
  currentLocale = next;
  persistLocale(next);
  listeners.forEach((listener) => listener());
}

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getServerLocaleSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo(() => ({ locale, setLocale: setGlobalLocale }), [locale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}

/** Translate function bound to the current locale. */
export function useT(): Translator {
  const { locale } = useLocale();
  return useMemo<Translator>(() => (key, vars) => t(locale, key, vars), [locale]);
}

/**
 * Tiny client leaf for translated text inside server components
 * (gear storefront pages): <T k="gearTitle" />.
 */
export function T({ k, vars }: { k: DictionaryKey; vars?: Record<string, string | number> }) {
  const translate = useT();
  return <>{translate(k, vars)}</>;
}
