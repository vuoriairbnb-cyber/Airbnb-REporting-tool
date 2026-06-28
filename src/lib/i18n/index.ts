import { en } from "@/lib/i18n/dictionaries/en";
import { fi } from "@/lib/i18n/dictionaries/fi";

export const LOCALE_COOKIE_NAME = "hostreport-locale";
export const SUPPORTED_LOCALES = ["en", "fi"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const dictionaries = {
  en,
  fi
} as const;

export type Dictionary = (typeof dictionaries)[Locale];

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : "en";
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
