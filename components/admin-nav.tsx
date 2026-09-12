"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNav() {
  const path = usePathname();
  
  const links = [
    { href: "/admin", label: "Genel Bakış" },
    { href: "/admin/organizations", label: "Kurumlar" },
    { href: "/admin/doctors", label: "Uzmanlar" },
    { href: "/admin/agencies", label: "Acenteler" },
    { href: "/admin/content", label: "Banner" },
    { href: "/admin/reviews", label: "Yorumlar" },
    { href: "/admin/release", label: "Release" }
  ];

  return (
    <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "10px", borderBottom: "1px solid var(--border-light)", whiteSpace: "nowrap" }} className="hide-scroll">
      {links.map(l => (
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

