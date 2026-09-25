"use client";
import Link from "next/link"; 
import { useEffect, useState } from "react"; 
import { usePathname, useRouter } from "next/navigation";
import { ShieldCheck } from "./icons";
import { CaretLeft, Bell } from "@phosphor-icons/react";

type Me = { name: string; role: "PATIENT" | "DOCTOR" | "ADMIN"; doctorSlug?: string | null } | null;

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(setMe).catch(() => {});
  }, []);

  useEffect(() => {
    if (me) {
      fetch("/api/notifications/unread")
        .then(res => res.ok ? res.json() : { unreadCount: 0 })
        .then(data => setUnreadNotifications(data.unreadCount || 0))
        .catch(() => {});
    }
  }, [me, pathname]);

  const hideBackOn = ["/", "/login", "/register", "/pro/login", "/pro/register"];
  const showBack = pathname && !hideBackOn.includes(pathname);

  const handleBack = () => {
    const isInternal = document.referrer && document.referrer.includes(window.location.host);
    if (isInternal) {
      router.back();
    } else {
      if (pathname.startsWith('/health/')) router.push('/services');
      else if (pathname.startsWith('/doctor/patients/')) router.push('/doctor');
      else if (pathname.startsWith('/admin/')) router.push('/admin');
      else router.push('/');
    }
  };

  return (
    <header className="site-header">
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {showBack && (
          <button 
            onClick={handleBack} 
            className="back-btn"
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", 
              width: "36px", height: "36px", borderRadius: "10px", 
              border: "1px solid rgba(18,63,107,0.1)", cursor: "pointer", 
              background: "#fff", color: "#123f6b", transition: "all 0.2s ease",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = "#f0f4f8"; e.currentTarget.style.borderColor = "rgba(18,63,107,0.2)"; }}
            onMouseOut={(e) => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.borderColor = "rgba(18,63,107,0.1)"; }}
            aria-label="Geri"
            title="Geri Dön"
          >
            <CaretLeft size={20} weight="bold" />
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
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/notifications" style={{ position: "relative", display: "flex", alignItems: "center", color: "#123f6b" }} title="Bildirimler">
              <Bell size={24} weight="duotone" />
              {unreadNotifications > 0 && (
                <span style={{
                  position: "absolute", top: "-4px", right: "-4px",
                  background: "#ef4444", color: "white", fontSize: "10px", fontWeight: "bold",
                  padding: "2px 5px", borderRadius: "10px", border: "2px solid white",
                  minWidth: "16px", textAlign: "center", lineHeight: 1
                }}>
                  {unreadNotifications > 99 ? "99+" : unreadNotifications}
                </span>
              )}
            </Link>
            <Link className="account-pill" href="/profile">
              {me.name.split(" ")[0]}
            </Link>
          </div>
        ) : (
          <Link className="secondary compact" href="/login">Giriş yap</Link>
        )}
      </div>
    </header>
  );
}
