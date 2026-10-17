"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function AdminNav() {
  const path = usePathname();
  const t = useTranslations("admin.adminNav");

  const links = [
    { href: "/admin", label: t("overview") },
    { href: "/admin/organizations", label: t("organizations") },
    { href: "/admin/doctors", label: t("doctors") },
    { href: "/admin/agencies", label: t("agencies") },
    { href: "/admin/content", label: t("banners") },
    { href: "/admin/reviews", label: t("reviews") },
    { href: "/admin/release", label: t("release") },
  ];

  return (
    <div className="workspace-nav">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={path === l.href ? "primary compact" : "secondary compact"}
          style={{ flexShrink: 0 }}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
