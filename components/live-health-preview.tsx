"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function LiveHealthPreview() {
  const t = useTranslations("liveHealthPreview");
  const [bp, setBp] = useState<any>(null);
  const [g, setG] = useState<any>(null);
  const [sl, setSl] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health/blood-pressure').then(r => r.ok ? r.json() : []).then(x => setBp(x[0]));
    fetch('/api/health/glucose').then(r => r.ok ? r.json() : []).then(x => setG(x[0]));
    fetch('/api/health/sleep').then(r => r.ok ? r.json() : []).then(x => setSl(x[0]));
  }, []);

  const sleep = sl ? ((new Date(sl.endedAt).getTime() - new Date(sl.startedAt).getTime()) / 3600000).toFixed(1) : '—';

  return (
    <div className="metric-row">
      <Link href="/health/blood-pressure" className="metric">
        <span>{t("bloodPressure")}</span>
        <strong>{bp ? `${bp.systolic}/${bp.diastolic}` : '—'}<small> mmHg</small></strong>
        <em>{bp ? t("lastRecord") : t("trackWithLogin")}</em>
      </Link>
      <Link href="/health/glucose" className="metric">
        <span>{t("bloodGlucose")}</span>
        <strong>{g ? g.value : '—'}<small> {g?.unit || 'mg/dL'}</small></strong>
        <em>{g?.context === 'FASTING' ? t("fasting") : t("lastRecord")}</em>
      </Link>
      <Link href="/health/sleep" className="metric">
        <span>{t("sleep")}</span>
        <strong>{sleep}<small> {t("hours")}</small></strong>
        <em>{sl ? t("quality", { score: sl.quality || '—' }) : t("noRecordYet")}</em>
      </Link>
    </div>
  );
}
