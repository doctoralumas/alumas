"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChatText, List, X } from "@phosphor-icons/react";
import HealthNavigator from "@/components/ai/health-navigator";

export default function AiLayout({ history, currentConversationId, initialMessages }: any) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [currentConversationId, isMobile]);

  // Ensure sidebar is open on desktop
  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  return (
    <div style={{ display: "flex", height: "100%", width: "100%", maxWidth: "1400px", margin: "0 auto", overflow: "hidden", position: "relative", backgroundColor: "#fff", borderTop: "1px solid #f1f5f9" }}>
      
      {/* Mobile Sidebar Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", zIndex: 40, backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: isMobile ? "fixed" : "static",
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 50,
        width: "280px",
        backgroundColor: "#f8fafc",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.3s ease-in-out",
        transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
        height: isMobile ? "100dvh" : "auto",
        flexShrink: 0
      }}>
        {isMobile && (
          <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0" }}>
            <span style={{ fontWeight: "bold", color: "#1e293b" }}>Sohbetler</span>
            <button onClick={() => setSidebarOpen(false)} style={{ padding: "8px", color: "#64748b", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#e2e8f0"} onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}>
              <X size={20} weight="bold" />
            </button>
          </div>
        )}

        <div style={{ padding: "16px", paddingTop: isMobile ? "16px" : "24px" }}>
          <Link href="/ai" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "12px", backgroundColor: "#0f172a", color: "#fff", borderRadius: "12px", fontWeight: 600, textDecoration: "none", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", transition: "background-color 0.2s" }} onMouseOver={e => e.currentTarget.style.backgroundColor = "#1e293b"} onMouseOut={e => e.currentTarget.style.backgroundColor = "#0f172a"}>
            <span>+</span> Yeni Sohbet
          </Link>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px 16px", display: "flex", flexDirection: "column", gap: "4px" }} className="hide-scrollbar">
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", padding: "8px", marginTop: "8px" }}>Geçmiş</div>
          {history.length === 0 ? (
            <div style={{ padding: "12px 8px", color: "#94a3b8", fontSize: "14px" }}>Henüz sohbet yok.</div>
          ) : (
            history.map((h: any) => (
              <Link 
                key={h.id} 
                href={`/ai?c=${h.id}`} 
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "12px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, transition: "all 0.2s", textDecoration: "none",
                  backgroundColor: currentConversationId === h.id ? "#ffffff" : "transparent",
                  color: currentConversationId === h.id ? "#2563eb" : "#475569",
                  boxShadow: currentConversationId === h.id ? "0 1px 2px 0 rgba(0, 0, 0, 0.05)" : "none",
                  border: currentConversationId === h.id ? "1px solid #e2e8f0" : "1px solid transparent"
                }}
                onMouseOver={e => { if(currentConversationId !== h.id) e.currentTarget.style.backgroundColor = "rgba(226, 232, 240, 0.5)" }}
                onMouseOut={e => { if(currentConversationId !== h.id) e.currentTarget.style.backgroundColor = "transparent" }}
              >
                <ChatText size={18} weight={currentConversationId === h.id ? "fill" : "regular"} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", flex: 1 }}>{h.title || "Yeni Sohbet"}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, backgroundColor: "#fff", position: "relative" }}>
        
        {/* Mobile Header */}
        {isMobile && (
          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px", borderBottom: "1px solid #f1f5f9", backgroundColor: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(12px)", position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 }}>
            <button 
              onClick={() => setSidebarOpen(true)}
              style={{ padding: "8px", color: "#475569", background: "transparent", border: "none", cursor: "pointer", borderRadius: "8px" }}
              onMouseOver={e => e.currentTarget.style.backgroundColor = "#f1f5f9"} 
              onMouseOut={e => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <List size={24} />
            </button>
            <div style={{ fontWeight: "bold", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
               <div style={{ width: "24px", height: "24px", borderRadius: "6px", background: "linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>
                  <ChatText size={14} weight="fill" />
               </div>
               Luma AI
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div style={{ flex: 1, overflow: "hidden", paddingTop: isMobile ? "73px" : "0" }}>
          <HealthNavigator 
            key={currentConversationId || 'new'}
            initialConversationId={currentConversationId} 
            initialMessages={initialMessages} 
            compact={true}
          />
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}

