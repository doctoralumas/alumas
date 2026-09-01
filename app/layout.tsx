import type { Metadata } from "next";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import Header from "@/components/header";
import BottomNav from "@/components/bottom-nav";
import CookieConsent from "@/components/cookie-consent";
import LegalFooter from "@/components/legal-footer";
export const metadata: Metadata = {title:"Alumas | Sağlığın tek yerde",description:"Alumas sağlık platformu MVP"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr" suppressHydrationWarning data-scroll-behavior="smooth"><body suppressHydrationWarning><div className="app-shell"><Header/><main>{children}</main><LegalFooter/><CookieConsent/><BottomNav/></div></body></html>}
