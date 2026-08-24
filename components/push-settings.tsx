"use client";

import { useEffect, useState } from "react";
import { registerNativePush } from "@/lib/native-push";

export default function PushSettings() {
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/push")
      .then((r) => (r.ok ? r.json() : []))
      .then((x) => setEnabled(x.some((d: any) => d.enabled)));
  }, []);

  async function enable() {
    setMsg("");
    try {
      const native = await registerNativePush();
      let token: string;
      let platform: string;

      if (native) {
        ({ token, platform } = native);
      } else {
        platform = "web";
        if ("Notification" in window) {
          const perm = await Notification.requestPermission();
          if (perm !== "granted") return setMsg("Bildirim izni verilmedi.");
        }
        token = "web-demo-" + crypto.randomUUID();
      }

      const r = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, token }),
      });
      if (!r.ok) throw new Error("Cihaz kaydedilemedi.");
      setEnabled(true);
      localStorage.setItem("alumas_push_token", token);
      setMsg(native ? "Cihaz push bildirimlerine kaydedildi." : "Web demo bildirim kaydı oluşturuldu.");
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Push kaydı başarısız.");
    }
  }

  async function disable() {
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
    setMsg("Bildirimler bu cihaz için kapatıldı.");
  }

  return (
    <div>
      <button className={enabled ? "danger" : "secondary"} onClick={enabled ? disable : enable}>
        {enabled ? "Push bildirimlerini kapat" : "Push bildirimlerini aç"}
      </button>
      {msg && <div className="inline-message">{msg}</div>}
    </div>
  );
}
