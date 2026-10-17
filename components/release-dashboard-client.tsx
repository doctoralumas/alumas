"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ReleaseDashboard() {
  const t = useTranslations("admin.releaseDashboard");
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/release-status")
      .then((r) => r.json())
      .then(setD);
  }, []);

  if (!d) return <div className="panel">{t("loading")}</div>;
  const go = d.databaseReady && !d.maintenance;

  return (
    <div className="profile-columns">
      <section className="panel">
        <span className="kicker">{t("kicker")}</span>
        <h2>{go ? t("go") : t("noGo")}</h2>
        <p>
          {t("statusLine", {
            db: d.databaseReady ? t("dbReady") : t("dbNotReady"),
            maint: d.maintenance ? t("maintOpen") : t("maintClosed"),
          })}
        </p>
      </section>
      <section className="panel">
        <h2>{t("buildTitle")}</h2>
        <p>
          {t("versionLabel")}
          <b>{d.version}</b>
        </p>
        <p>
          {t("shaLabel")}
          <code>{d.buildSha}</code>
        </p>
        <p>
          {t("channelLabel")}
          {d.channel}
        </p>
      </section>
      <section className="panel form-span">
        <h2>{t("flagsTitle")}</h2>
        <div className="slot-list">
          {Object.entries(d.features || {}).map(([k, v]) => (
            <div className="slot-row" key={k}>
              <b>{k}</b>
              <span className="status">{v ? t("flagActive") : t("flagInactive")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
