"use client";

import { useState } from "react";
import { Sparkle, X } from "@phosphor-icons/react";
import HealthNavigator from "./health-navigator";
import { usePathname } from "next/navigation";

export default function LumaCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Hide the copilot entirely on the dedicated AI page or in admin panels
  if (pathname === "/ai" || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      {/* The Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "84px", // Above mobile bottom nav
          right: "20px",
          width: "60px",
          height: "60px",
          borderRadius: "30px",
          background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)",
          color: "#fff",
          border: "none",
          boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.5), 0 8px 10px -6px rgba(59, 130, 246, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 9999,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: isOpen ? "scale(0.9)" : "scale(1)",
        }}
        aria-label="Luma Asistanı Aç"
      >
        {isOpen ? <X size={28} weight="bold" /> : <Sparkle size={32} weight="fill" />}
      </button>

      {/* The Popover Window */}
      {isOpen && (
        <div 
          style={{
            position: "fixed",
            bottom: "160px",
            right: "20px",
            width: "calc(100vw - 40px)",
            maxWidth: "420px",
            height: "600px",
            maxHeight: "calc(100vh - 200px)",
            background: "#fff",
            borderRadius: "28px",
            boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15), 0 0 20px rgba(0,0,0,0.05)",
            border: "1px solid #e2e8f0",
            zIndex: 9998,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", padding: "20px", color: "#fff", display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ background: "rgba(255,255,255,0.2)", padding: "8px", borderRadius: "12px" }}>
              <Sparkle size={24} weight="fill" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Luma Copilot</h3>
              <span style={{ fontSize: "12px", opacity: 0.9 }}>Sağlık Asistanınız</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", cursor: "pointer", padding: "4px" }}>
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#f8fafc" }}>
            <HealthNavigator compact={true} />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (min-width: 768px) {
          button[aria-label="Luma Asistanı Aç"] {
            bottom: 40px !important;
            right: 40px !important;
          }
          div[style*="bottom: 160px"] {
            bottom: 120px !important;
            right: 40px !important;
          }
        }
      `}} />
    </>
  );
}
