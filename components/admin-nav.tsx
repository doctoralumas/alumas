"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

interface AdminNavProps {
  adminUser?: {
    name: string;
    email: string;
  };
}

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
}

interface NavHub {
  id: string;
  label: string;
  items: NavItem[];
}

export default function AdminNav({ adminUser }: AdminNavProps) {
  const pathname = usePathname();
  const t = useTranslations("admin.adminNav");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Auto close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navHubs: NavHub[] = [
    {
      id: "overview",
      label: t("hubOverview"),
      items: [
        { href: "/admin", label: t("overview"), icon: "📊", exact: true },
      ],
    },
    {
      id: "network",
      label: t("hubNetwork"),
      items: [
        { href: "/admin/doctors", label: t("doctors"), icon: "👨‍⚕️" },
        { href: "/admin/organizations", label: t("organizations"), icon: "🏥" },
        { href: "/admin/agencies", label: t("agencies"), icon: "✈️" },
        { href: "/admin/users", label: t("users"), icon: "👥" },
      ],
    },
    {
      id: "operations",
      label: t("hubOperations"),
      items: [
        { href: "/admin/appointments", label: t("appointments"), icon: "📅" },
        { href: "/admin/reviews", label: t("reviews"), icon: "⭐" },
        { href: "/admin/inquiries", label: t("inquiries"), icon: "💬" },
        { href: "/admin/content", label: t("content"), icon: "🎨" },
      ],
    },
    {
      id: "system",
      label: t("hubSystem"),
      items: [
        { href: "/admin/system", label: t("system"), icon: "🛡️" },
        { href: "/admin/release", label: t("release"), icon: "🚀" },
      ],
    },
  ];

  function isActive(href: string, exact = false) {
    if (exact) {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  // Get current section label for mobile bar
  const currentItem = navHubs
    .flatMap((h) => h.items)
    .find((item) => isActive(item.href, item.exact));
  const currentTitle = currentItem?.label || t("overview");

  return (
    <>
      {/* MOBILE STICKY TOP BAR (< 1024px) */}
      <div
        className="admin-mobile-topbar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "#0f172a",
          color: "#ffffff",
          padding: "12px 16px",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label={t("openMenu")}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#ffffff",
              borderRadius: "8px",
              padding: "8px 12px",
              fontSize: "16px",
              cursor: "pointer",
            }}
          >
            ☰
          </button>
          <div>
            <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" }}>
              ALUMAS Admin
            </div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f8fafc" }}>
              {currentTitle}
            </div>
          </div>
        </div>

        <Link
          href="/"
          style={{
            fontSize: "12px",
            color: "#94a3b8",
            textDecoration: "none",
            padding: "6px 10px",
            background: "#1e293b",
            borderRadius: "6px",
          }}
        >
          Siteye Dön ↗
        </Link>
      </div>

      {/* MOBILE DRAWER BACKDROP & MENU (< 1024px) */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="admin-mobile-drawer"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div
            style={{
              width: "290px",
              maxWidth: "85%",
              height: "100%",
              background: "#0f172a",
              color: "#f8fafc",
              display: "flex",
              flexDirection: "column",
              boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
              overflowY: "auto",
            }}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: "20px",
                borderBottom: "1px solid #1e293b",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "16px", fontWeight: 800, letterSpacing: "-0.02em", color: "#ffffff" }}>
                  ALUMAS <span style={{ color: "#38bdf8", fontSize: "12px", fontWeight: 600 }}>v2 ADMIN</span>
                </div>
                {adminUser && (
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
                    {adminUser.name}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label={t("closeMenu")}
                style={{
                  background: "#1e293b",
                  border: "none",
                  color: "#94a3b8",
                  fontSize: "18px",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Drawer Links */}
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "20px", flex: 1 }}>
              {navHubs.map((hub) => (
                <div key={hub.id}>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: "8px",
                      paddingLeft: "8px",
                    }}
                  >
                    {hub.label}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {hub.items.map((item) => {
                      const active = isActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            padding: "10px 12px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: active ? 700 : 500,
                            background: active ? "#1e293b" : "transparent",
                            color: active ? "#38bdf8" : "#cbd5e1",
                            borderLeft: active ? "3px solid #38bdf8" : "3px solid transparent",
                            textDecoration: "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{ fontSize: "16px" }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div
              style={{
                padding: "16px 20px",
                borderTop: "1px solid #1e293b",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "13px",
              }}
            >
              <Link href="/" style={{ color: "#94a3b8", textDecoration: "none" }}>
                ← Ana Sayfaya Dön
              </Link>
              <Link href="/profile" style={{ color: "#94a3b8", textDecoration: "none" }}>
                👤 Profilim
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR (>= 1024px) */}
      <aside
        className="admin-desktop-sidebar"
        style={{
          width: isCollapsed ? "72px" : "260px",
          minWidth: isCollapsed ? "72px" : "260px",
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "#0f172a",
          borderRight: "1px solid #1e293b",
          flexDirection: "column",
          color: "#f8fafc",
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex: 30,
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: isCollapsed ? "20px 12px" : "20px 20px",
            borderBottom: "1px solid #1e293b",
            display: "flex",
            alignItems: "center",
            justifyContent: isCollapsed ? "center" : "space-between",
          }}
        >
          {!isCollapsed && (
            <div>
              <Link
                href="/admin"
                style={{
                  fontSize: "17px",
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                  color: "#ffffff",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                ALUMAS <span style={{ fontSize: "10px", padding: "2px 6px", background: "#1e293b", color: "#38bdf8", borderRadius: "4px", fontWeight: 700 }}>v2</span>
              </Link>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                {t("adminPanel")}
              </div>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "Genişlet" : "Daralt"}
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#94a3b8",
              borderRadius: "6px",
              padding: "6px 8px",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            {isCollapsed ? "→" : "←"}
          </button>
        </div>

        {/* Navigation Hubs */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isCollapsed ? "16px 8px" : "16px 14px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {navHubs.map((hub) => (
            <div key={hub.id}>
              {!isCollapsed && (
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: "8px",
                    paddingLeft: "8px",
                  }}
                >
                  {hub.label}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {hub.items.map((item) => {
                  const active = isActive(item.href, item.exact);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={isCollapsed ? item.label : undefined}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: isCollapsed ? "center" : "flex-start",
                        gap: "10px",
                        padding: isCollapsed ? "10px 0" : "9px 12px",
                        borderRadius: "8px",
                        fontSize: "13px",
                        fontWeight: active ? 700 : 500,
                        background: active ? "#1e293b" : "transparent",
                        color: active ? "#38bdf8" : "#94a3b8",
                        borderLeft: active && !isCollapsed ? "3px solid #38bdf8" : "3px solid transparent",
                        textDecoration: "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "16px" }}>{item.icon}</span>
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info & links */}
        <div
          style={{
            padding: isCollapsed ? "14px 8px" : "16px 18px",
            borderTop: "1px solid #1e293b",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            background: "#090d16",
          }}
        >
          {!isCollapsed && adminUser && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#1e293b",
                  color: "#38bdf8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {adminUser.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#f8fafc", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {adminUser.name}
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {adminUser.email}
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: isCollapsed ? "center" : "space-between", alignItems: "center" }}>
            <Link
              href="/"
              style={{
                fontSize: "12px",
                color: "#64748b",
                textDecoration: "none",
              }}
              title="Siteye Dön"
            >
              {isCollapsed ? "🏠" : "← Siteye Dön"}
            </Link>
            {!isCollapsed && (
              <Link
                href="/profile"
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  textDecoration: "none",
                }}
              >
                Profilim
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
