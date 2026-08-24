"use client";

import { useEffect, useState } from "react";
import {
  connectNativeHealth,
  HEALTH_SCOPES,
  HealthProvider,
  HealthScope,
  syncNativeHealth,
} from "@/lib/health-platform";

type Row = { provider: string; scopes: string[]; lastSyncAt?: string };

export default function HealthIntegrations() {
  const [rows, setRows] = useState<Row[]>([]);
  const [scopes, setScopes] = useState<HealthScope[]>(["steps", "heart_rate", "weight"]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => fetch("/api/health/integrations").then((r) => (r.ok ? r.json() : [])).then(setRows);
  useEffect(() => { load(); }, []);

  function toggle(scope: HealthScope) {
    setScopes((current) => current.includes(scope) ? current.filter((x) => x !== scope) : [...current, scope]);
  }

  async function connect(provider: HealthProvider) {
    setBusy(true);
    setMsg("");
    try {
      const native = await connectNativeHealth(provider, scopes);
      if (!native.ok && "demo" in native) {
        setMsg("Web önizlemesinde native sağlık deposu açılamaz. Mobil cihazda gerçek izin ekranı açılır.");
      } else if (!native.ok) {
        setMsg(native.reason || "Sağlık erişimi verilemedi.");
        return;
      }

      const r = await fetch("/api/health/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, scopes }),
      });
      if (!r.ok) throw new Error("Bağlantı kaydedilemedi.");
      await load();
      if (native.ok) setMsg("Sağlık izinleri kaydedildi. Şimdi verileri senkronize edebilirsin.");
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Bağlantı kurulamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function sync(provider: HealthProvider, providerScopes: string[]) {
    setBusy(true);
    setMsg("");
    try {
      const result = await syncNativeHealth(providerScopes as HealthScope[]);
      if ("demo" in result) {
        setMsg("Sağlık senkronizasyonu yalnızca iOS/Android uygulamasında çalışır.");
        return;
      }
      const r = await fetch("/api/health/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, samples: result.samples }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Senkronizasyon kaydedilemedi.");
      setMsg(`${body.imported} sağlık kaydı Alumas'a aktarıldı.`);
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : "Senkronizasyon başarısız.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel health-section">
      <h2>Cihaz sağlık verileri</h2>
      <p>Yalnızca seçtiğin veri türlerine erişim istenir. İzinleri cihaz ayarlarından istediğin zaman kapatabilirsin.</p>
      <div className="scope-grid">
        {HEALTH_SCOPES.map((scope) => (
          <label key={scope} className="scope-chip">
            <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggle(scope)} />
            {scope === "steps" ? "Adım" : scope === "heart_rate" ? "Nabız" : scope === "weight" ? "Kilo" : "Uyku"}
          </label>
        ))}
      </div>
      <div className="integration-actions">
        <button disabled={busy} className="secondary" onClick={() => connect("apple_health")}>Apple Health bağla</button>
        <button disabled={busy} className="secondary" onClick={() => connect("health_connect")}>Health Connect bağla</button>
      </div>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="integration-list">
        {rows.map((row) => (
          <div key={row.provider} className="integration-row">
            <span className="status">
              {row.provider === "apple_health" ? "Apple Health" : "Health Connect"} · {row.scopes.length} izin
            </span>
            <button disabled={busy} className="text-button" onClick={() => sync(row.provider as HealthProvider, row.scopes)}>
              Senkronize et
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
