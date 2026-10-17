"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserLocale } from "@/lib/locale-actions";
import { LOCALE_COOKIE, type Locale } from "@/lib/locale-config";
import { Globe } from "@phosphor-icons/react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const currentLocale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelect = (locale: Locale) => {
    if (locale === currentLocale || isPending) return;

    startTransition(async () => {
      // Set client-side cookie immediately for fast responsiveness
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
      await setUserLocale(locale);
      router.refresh();
    });
  };

  return (
    <div
      className={`lang-switcher ${className}`}
      role="group"
      aria-label="Dil Seçimi / Language Selection"
    >
      <Globe size={14} className="lang-switcher-globe" aria-hidden="true" />
      <button
        type="button"
        onClick={() => handleSelect("tr")}
        disabled={isPending}
        aria-pressed={currentLocale === "tr"}
        aria-label="Türkçe"
        className={`lang-btn ${currentLocale === "tr" ? "active" : ""}`}
      >
        TR
      </button>
      <button
        type="button"
        onClick={() => handleSelect("en")}
        disabled={isPending}
        aria-pressed={currentLocale === "en"}
        aria-label="English"
        className={`lang-btn ${currentLocale === "en" ? "active" : ""}`}
      >
        EN
      </button>
    </div>
  );
}

