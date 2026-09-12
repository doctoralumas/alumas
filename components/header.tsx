"use client";
import Link from "next/link"; 
import { useEffect, useState } from "react"; 
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "./icons";
import { ChevronLeft } from "lucide-react";

type Me = { name: string; role: "PATIENT" | "DOCTOR" | "ADMIN"; doctorSlug?: string | null } | null;

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  const hideBackOn = ["/", "/login", "/register", "/pro/login", "/pro/register"];
  const showBack = pathname && !hideBackOn.includes(pathname);

  return (
    <header className="site-header">
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {showBack && (
          <button 
            onClick={() => router.back()} 
            style={{ padding: "6px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "8px", border: "1px solid var(--border)", cursor: "pointer", background: "var(--surface)" }}
            aria-label="Geri"
            title="Geri Dön"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <Link href="/" className="brand brand-with-logo">
          <img src="/brand/alumas-logo.png" alt="Alumas" />
          <span>ALUMAS</span>
        </Link>
      </div>

      <div className="header-actions">
        <Link className="secondary compact" href="/ai">Luma Asistan</Link>
        <Link className="secondary compact" href="/services">Tüm Hizmetler</Link>
        <div className="secure"><ShieldCheck size={17} /> Güvenli sağlık alanı</div>
        {me ? (
          <Link className="account-pill" href={me.role === "DOCTOR" ? "/doctor" : me.role === "ADMIN" ? "/admin" : "/profile"}>
            {me.name.split(" ")[0]}
          </Link>
        ) : (
          <Link className="secondary compact" href="/login">Giriş yap</Link>
        )}
      </div>
    </header>
  );
}
