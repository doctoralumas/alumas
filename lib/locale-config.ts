export type Locale = "tr" | "en";

export const defaultLocale: Locale = "tr";
export const locales: readonly Locale[] = ["tr", "en"] as const;

export const LOCALE_COOKIE = "NEXT_LOCALE";

