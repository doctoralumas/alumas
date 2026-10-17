"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const STATUS_KEYS = ["OFFLINE", "ONLINE", "AVAILABLE", "BUSY"] as const;

export default function DoctorPresence({ initial }: { initial: string }) {
  const t = useTranslations("professional.doctorPresence");
  const [status, setStatus] = useState(initial);
  const [msg, setMsg] = useState("");

  async function save(v: string) {
    setStatus(v);
    const r = await fetch("/api/doctor/presence", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: v }),
    });
    setMsg(r.ok ? t("success") : t("failed"));
  }

  return (
    <div>
      <div className="presence-picker-v25">
        {STATUS_KEYS.map((k) => (
          <button
            key={k}
            className={status === k ? "active" : ""}
            onClick={() => save(k)}
          >
            {t(k)}
          </button>
        ))}
      </div>
      {msg && <small>{msg}</small>}
    </div>
  );
}