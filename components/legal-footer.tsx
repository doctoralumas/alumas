"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LegalFooter() {
  const t = useTranslations("legalFooter");

  return (
    <footer className="legal-footer">
      <Link href="/privacy">{t("kvkk")}</Link>
      <Link href="/health-data">{t("healthData")}</Link>
      <Link href="/ai-policy">{t("aiPolicy")}</Link>
      <Link href="/cookies">{t("cookies")}</Link>
      <Link href="/terms">{t("terms")}</Link>
      <Link href="/cross-border">{t("crossBorder")}</Link>
      <Link href="/health-tourism-legal">{t("healthTourism")}</Link>
    </footer>
  );
}