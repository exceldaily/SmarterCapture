// Locale system for Smarter Capture — v1 scope: UI CHROME ONLY.
//
// DELIBERATE DECISION — what stays English in v1 and why:
// Camera model names, setting VALUES (RockSteady, D-Log M, 4K, FPS numbers),
// scene names, option names and every piece of prose the recommendation
// engine generates (why-it-works, warnings, mistakes, what-if answers,
// on-camera menu paths) are NOT translated. Machine-translating settings
// advice risks accuracy: a mistranslated stabilization mode or menu path
// sends someone into a menu that does not exist on their camera. Menu labels
// on the physical cameras are also usually English, so keeping values in
// English is what actually matches the screen in the user's hand. Engine
// prose gets translated only when a native speaker can review it.
//
// Currency display lives in ./currency.ts. Dictionaries live in
// ./dictionaries.ts. The client context provider is app/locale-provider.tsx.

import { dictionaries } from "./dictionaries";

export type Locale = "en" | "es" | "fr" | "de" | "pt" | "ja" | "th";

export const locales: Locale[] = ["en", "es", "fr", "de", "pt", "ja", "th"];

/** Each locale's own name for itself, shown in the language switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
  ja: "日本語",
  th: "ไทย",
};

/** BCP 47 tags for Intl formatting (numbers, currency). */
export const intlLocales: Record<Locale, string> = {
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  de: "de-DE",
  pt: "pt-PT",
  ja: "ja-JP",
  th: "th-TH",
};

/**
 * Every translatable UI-chrome string. Adding a key here forces every
 * dictionary in ./dictionaries.ts to provide it, so a locale can never
 * silently miss a string.
 */
export interface Dictionary {
  // Header + mobile nav
  navHome: string;
  navRecipes: string;
  navGear: string;
  navLearn: string;
  navBag: string;
  navBagShort: string;
  navShoot: string;

  // Hero (title is split so the <br /> + <em> markup survives translation;
  // heroTitle2 may be empty for languages that break differently)
  heroTitle1: string;
  heroTitle2: string;
  heroTitleEm: string;
  heroSubtitle: string; // supports {brand}
  heroCtaCamera: string;
  heroCtaBag: string;
  trustCompat: string;
  trustInstant: string;
  trustNoLogin: string;

  // "Describe the shot" box
  naturalTitle: string;
  naturalSub: string;
  naturalFootnote: string; // supports {brand}

  // Home sections
  homeScenesEyebrow: string;
  homeScenesTitle: string;
  homeScenesAll: string;
  howEyebrow: string;
  howTitle1: string;
  howTitle2: string;
  howBody: string; // supports {brand}
  howStep1: string;
  howStep2: string;
  howStep3: string;
  statCameras: string;
  statScenes: string;
  statRecipes: string;
  statImpossible: string;
  recentEyebrow: string;
  recentTitle: string;
  recentAll: string;
  recentLoad: string;

  // Flow (3-step wizard)
  flowStepOf: string; // supports {step}
  flowStep1Label: string;
  flowStep2Label: string;
  flowStep3Label: string;
  flowCameraTitle: string;
  flowCameraSub: string;
  flowSceneTitle: string;
  flowSceneSub: string;
  flowCondTitle: string;
  flowCondSub: string;
  flowSelected: string; // supports {name}
  flowChooseScene: string;
  flowAddConditions: string;
  flowBuildSetup: string;
  condLight: string;
  condMovement: string;
  condMount: string;
  advancedToggle: string;
  advPlatform: string;
  advEditing: string;
  advPriority: string;
  advAudio: string;
  advAccessories: string;

  // Result view
  resultReady: string;
  resultTitle: string;
  resultSub: string;
  resultRecommendedFor: string;
  resultConfidenceLabel: string;
  resultRecommendedSetup: string;
  resultWhy: string;
  resultDontForget: string;
  resultBeforeRecording: string;
  resultChecks: string;
  resultAdjustEyebrow: string;
  resultAdjustTitle: string;
  resultProToggle: string;
  resultProSub: string;
  resultWhatIfEyebrow: string;
  resultWhatIfTitle: string;
  resultChangeConditions: string;
  resultSave: string;
  resultShare: string;
  resultSaveSetup: string;
  resultAnotherShot: string;
  confidenceOptimal: string;
  confidenceTradeoffs: string;
  confidenceChallenging: string;
  stripLight: string;
  stripMotion: string;
  stripMount: string;
  stripOutput: string;

  // Recipes view
  recipesLoad: string;
  comingSoon: string;

  // Gear storefront
  gearTitle: string;
  gearEyebrow: string;
  gearSub: string;
  gearNavAssistant: string;
  gearNavGear: string;
  gearNavAllGear: string;
  gearCatAll: string;
  gearCatPov: string;
  gearCatWater: string;
  gearCatTravel: string;
  gearCatVehicle: string;
  gearCatSports: string;
  gearCatEveryday: string;
  gearCatMounts: string;
  gearStatusReady: string;
  gearStatusFuture: string;
  gearStatusResearch: string;
  gearView: string;
  gearPricePending: string;
  gearPriceShipping: string;
  gearPriceUnavailable: string;
  gearBuy: string;
  gearCheckoutGated: string;
  gearChargedUsd: string;

  // Footer disclaimer
  footerDisclaimerLead: string; // supports {brand}
  footerDisclaimerBody: string;
  footerDisclaimerTrademarks: string;
  footerEquipmentRisk: string;
  footerIndependent: string;
}

export type DictionaryKey = keyof Dictionary;

/** Shape of the bound translate function handed out by useT(). */
export type Translator = (key: DictionaryKey, vars?: Record<string, string | number>) => string;

/**
 * Look up a chrome string. Unknown locales and missing values fall back to
 * English. `{name}` placeholders are replaced from `vars`.
 */
export function t(locale: Locale, key: DictionaryKey, vars?: Record<string, string | number>): string {
  const template = dictionaries[locale]?.[key] ?? dictionaries.en[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/* --- persistence + detection ---------------------------------------------- */

const STORAGE_KEY = "sc-locale";

function isLocale(value: string | null): value is Locale {
  return value !== null && (locales as string[]).includes(value);
}

export function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null; // Blocked storage must never break the page.
  }
}

export function persistLocale(locale: Locale) {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Private-mode storage failures are fine; the choice just won't stick.
  }
}

/** Best match from the browser's language list, defaulting to English. */
export function detectLocale(): Locale {
  try {
    const candidates = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const tag of candidates) {
      const base = tag?.toLowerCase().split("-")[0];
      if (isLocale(base)) return base;
    }
  } catch {
    // SSR or an exotic environment: fall through to English.
  }
  return "en";
}

/** Stored choice wins; otherwise browser language; otherwise English. */
export function getInitialLocale(): Locale {
  return readStoredLocale() ?? detectLocale();
}
