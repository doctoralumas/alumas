"use client";

import { useEffect, useState } from "react";
import { registerNativePush } from "@/lib/native-push";
import { registerWebPush } from "@/lib/web-push";
import { BellRinging, BellSlash, WarningCircle } from "@phosphor-icons/react";

export default function PushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/push")
      .then((r) => (r.ok ? r.json() : []))
      .then((x) => {
        setEnabled(x.some((d: any) => d.enabled));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function toggle() {
    if (enabled) {
      await disable();
    } else {
      await enable();
    }
  }

  async function enable() {
    setLoading(true);
    setMsg("");
    try {
      const native = await registerNativePush();
      let token: string;
      let platform: string;

      if (native) {
        ({ token, platform } = native);
      } else {
        platform = "web";
        const webToken = await registerWebPush();
        if (!webToken) {
          setLoading(false);
          return setMsg("Bildirim izni verilmedi veya desteklenmiyor.");
        }
        token = webToken;
      }

      const r = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, token }),
      });
      if (!r.ok) throw new Error("Cihaz kaydedilemedi.");
      setEnabled(true);
      localStorage.setItem("alumas_push_token", token);
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Push kaydı başarısız.");
    } finally {
      setLoading(false);
    }
  }

  async function disable() {
    setLoading(true);
    const token = localStorage.getItem("alumas_push_token");
    if (token) {
      await fetch("/api/push", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    }
    localStorage.removeItem("alumas_push_token");
    setEnabled(false);
    setLoading(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "24px", background: "#fff", borderRadius: "24px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)" }}>
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "16px", background: enabled ? "#eff6ff" : "#f1f5f9", color: enabled ? "#3b82f6" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {enabled ? <BellRinging size={24} weight="duotone" /> : <BellSlash size={24} weight="duotone" />}
          </div>
          <div>
            <strong style={{ display: "block", fontSize: "16px", color: "#0f172a" }}>Anlık Bildirimler</strong>
            <span style={{ fontSize: "14px", color: enabled ? "#3b82f6" : "#64748b" }}>
              {enabled ? "Açık (Bu cihazda)" : "Kapalı"}
            </span>
          </div>
        </div>

        <button 
          onClick={toggle}
          disabled={loading}
          style={{ position: "relative", width: "52px", height: "28px", borderRadius: "100px", background: enabled ? "#3b82f6" : "#cbd5e1", border: "none", cursor: "pointer", transition: "background 0.3s", opacity: loading ? 0.7 : 1 }}
        >
          <div style={{ position: "absolute", top: "2px", left: enabled ? "26px" : "2px", width: "24px", height: "24px", background: "#fff", borderRadius: "50%", transition: "left 0.3s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
        </button>
      </div>

      {msg && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#ef4444", background: "#fef2f2", padding: "10px 16px", borderRadius: "12px", border: "1px solid #fecaca" }}>
          <WarningCircle size={16} weight="bold" /> {msg}
        </div>
      )}

    </div>
  );
}
