import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale, defaultLocale } from "./locale-config";

export * from "./locale-config";

export async function getUserLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    const val = jar.get(LOCALE_COOKIE)?.value;
    if (val === "tr" || val === "en") {
      return val;
    }
  } catch {
    // Fallback if accessed outside request context
  }
  return defaultLocale;
}
