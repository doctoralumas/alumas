"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  connectNativeHealth,
  HEALTH_SCOPES,
  HealthProvider,
  HealthScope,
  syncNativeHealth,
} from "@/lib/health-platform";

type Row = { provider: string; scopes: string[]; lastSyncAt?: string };

export default function HealthIntegrations() {
  const t = useTranslations("healthIntegrations");
  const [rows, setRows] = useState<Row[]>([]);
  const [scopes, setScopes] = useState<HealthScope[]>(["steps", "heart_rate", "weight"]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [isNative, setIsNative] = useState(true);

  const load = () => fetch("/api/health/integrations").then((r) => (r.ok ? r.json() : [])).then(setRows);
  
  useEffect(() => {
    load();
    if (typeof window !== 'undefined') {
      import("@capacitor/core").then(({ Capacitor }) => {
        setIsNative(Capacitor.isNativePlatform());
      }).catch(() => {});
    }
  }, []);

  if (!isNative) return null;

  function toggle(scope: HealthScope) {
    setScopes((current) => current.includes(scope) ? current.filter((x) => x !== scope) : [...current, scope]);
  }

  async function connect(provider: HealthProvider) {
    setBusy(true);
    setMsg("");
    try {
      const native = await connectNativeHealth(provider, scopes);
      if (!native.ok && "demo" in native) {
        setMsg(t("previewNotice"));
      } else if (!native.ok) {
        setMsg(native.reason || t("accessDenied"));
        return;
      }

      const r = await fetch("/api/health/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, scopes }),
      });
      if (!r.ok) throw new Error(t("saveFailed"));
      await load();
      if (native.ok) setMsg(t("saveSuccess"));
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t("connectionFailed"));
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
        setMsg(t("syncMobileOnly"));
        return;
      }
      const r = await fetch("/api/health/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, samples: result.samples }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || t("syncFailed"));
      setMsg(t("syncSuccess", { count: body.imported }));
      await load();
    } catch (error) {
      setMsg(error instanceof Error ? error.message : t("syncError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("description")}</p>
      <div className="scope-grid">
        {HEALTH_SCOPES.map((scope) => (
          <label key={scope} className="scope-chip">
            <input type="checkbox" checked={scopes.includes(scope)} onChange={() => toggle(scope)} />
            {t(`scopes.${scope}` as any)}
          </label>
        ))}
      </div>
      <div className="integration-actions">
        <button disabled={busy} className="secondary" onClick={() => connect("apple_health")}>{t("connectApple")}</button>
        <button disabled={busy} className="secondary" onClick={() => connect("health_connect")}>{t("connectGoogle")}</button>
      </div>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="integration-list">
        {rows.map((row) => (
          <div key={row.provider} className="integration-row">
            <span className="status">
              {row.provider === "apple_health" ? "Apple Health" : "Health Connect"} · {row.scopes.length} {t("permissionsSuffix")}
            </span>
            <button disabled={busy} className="text-button" onClick={() => sync(row.provider as HealthProvider, row.scopes)}>
              {t("syncAction")}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
