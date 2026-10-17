"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function VideoStartButton({appointmentId}:{appointmentId:string}){
  const t = useTranslations("videoConsultation");
  const [busy,setBusy]=useState(false);
  async function start(){
    setBusy(true);
    const r=await fetch('/api/video-consultations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({appointmentId})});
    const j=await r.json();
    setBusy(false);
    if(r.ok) location.href=j.joinUrl;
    else alert(j.error||t('error'));
  }
  return <button className="secondary" onClick={start} disabled={busy}>{busy?t('preparing'):t('startCall')}</button>;
}
