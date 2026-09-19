"use client";
import { LockKey, ShieldCheck, Heartbeat } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function LockedOverlay() {
  const pathname = usePathname() || "";
  
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, background: "rgba(248, 250, 252, 0.4)", backdropFilter: "blur(2px)" }}>
       <div style={{ background: "#fff", padding: "48px 32px", borderRadius: "32px", boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(15, 23, 42, 0.05)", textAlign: "center", maxWidth: "420px", width: "90%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          
          <div style={{ width: "64px", height: "64px", borderRadius: "20px", background: "#f0f9ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px", color: "#0284c7" }}>
             <LockKey size={32} weight="duotone" />
          </div>
          
          <h2 style={{ fontSize: "24px", color: "#0f172a", marginBottom: "12px", fontWeight: 700, letterSpacing: "-0.5px" }}>
            Bu Özellik Kilitli
          </h2>
          
          <p style={{ color: "#64748b", marginBottom: "32px", fontSize: "16px", lineHeight: 1.6 }}>
            Kişisel sağlık verilerinizi kaydetmek, geçmiş ölçümlerinizi takip etmek ve yapay zeka analizlerinden faydalanmak için lütfen Alumas'a giriş yapın.
          </p>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
            <Link href={`/login?next=${encodeURIComponent(pathname)}`} style={{ background: "#0f172a", color: "#fff", padding: "14px 24px", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", transition: "all 0.2s" }}>
              Giriş Yap / Kayıt Ol
            </Link>
            <Link href="/services" style={{ background: "#f8fafc", color: "#475569", padding: "14px 24px", borderRadius: "100px", textDecoration: "none", fontWeight: 600, fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center", width: "100%", border: "1px solid #e2e8f0" }}>
              Tüm Hizmetlere Dön
            </Link>
          </div>

          <div style={{ marginTop: "32px", display: "flex", alignItems: "center", gap: "16px", color: "#94a3b8", fontSize: "13px", fontWeight: 500 }}>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><ShieldCheck size={16} /> Uçtan uca şifreli</span>
             <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Heartbeat size={16} /> KVKK Uyumlu</span>
          </div>

       </div>
    </div>
  );
}
