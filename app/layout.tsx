import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";
import "./home-visual.css";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import CookieConsent from "@/components/cookie-consent";
import LegalFooter from "@/components/legal-footer";
import LumaCopilot from "@/components/ai/luma-copilot";
import { LocationProvider } from "@/lib/location-context";
import { NextIntlClientProvider } from "next-intl";
import { getUserLocale } from "@/lib/locale";
import { getMessagesForLocale } from "@/locales";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getUserLocale();
  if (locale === "en") {
    return {
      title: "Alumas | Your Health in One Place",
      description: "Alumas unified healthcare platform",
    };
  }
  return {
    title: "Alumas | Sağlığın tek yerde",
    description: "Alumas sağlık platformu",
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getUserLocale();
  const messages = getMessagesForLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <LocationProvider>
            <div className="app-shell">
              <Header />
              <main>{children}</main>
              <LegalFooter />
              <CookieConsent />
              <LumaCopilot />
              <BottomNav />
            </div>
          </LocationProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
