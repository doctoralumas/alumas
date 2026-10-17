"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale, locales, defaultLocale } from "./locale";

export async function setUserLocale(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  const validLocale: Locale = locales.includes(locale) ? locale : defaultLocale;
  cookieStore.set(LOCALE_COOKIE, validLocale, {
    path: "/",
    maxAge: 31536000, // 1 year
    sameSite: "lax",
    httpOnly: false, // allow reading on client if necessary
  });
}

