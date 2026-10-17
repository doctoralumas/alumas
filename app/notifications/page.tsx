"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellRinging, Checks, CaretLeft, CalendarCheck, Pill, Stethoscope, ChatsCircle, Info } from "@phosphor-icons/react";
import { useTranslations, useLocale } from "next-intl";

type N = { id: string; title: string; body: string; kind: string; readAt: string | null; createdAt: string };

function localizeNotification(n: N, t: any, locale: string): { title: string; body: string } {
  if (locale !== "en") {
    return { title: n.title, body: n.body };
  }

  let title = n.title;
  let body = n.body;

  // 1. Message: "{name} size mesaj gönderdi" -> "{name} sent you a message"
  if (title.endsWith(" size mesaj gönderdi")) {
    const sender = title.replace(/\s+size mesaj gönderdi$/, "");
    title = t("templates.messageSent", { name: sender });
  }

  if (body === "📎 Dosya gönderildi" || body === "Dosya gönderildi") {
    body = t("templates.fileSent");
  }

  // 2. Appointment confirmed
  if (title === "Randevun onaylandı" || title === "Randevu onaylandı") {
    title = t("templates.appointmentConfirmed");
  }

  // 3. Appointment cancelled
  if (title === "Randevu iptal edildi") {
    title = t("templates.appointmentCancelled");
  }
  if (body.endsWith(" randevunuz iptal edildi.")) {
    const doc = body.replace(/\s+randevunuz iptal edildi\.$/, "");
    body = t("templates.appointmentCancelledBody", { name: doc });
  }

  // 4. Appointment rescheduled
  if (title === "Randevu ertelendi") {
    title = t("templates.appointmentRescheduled");
  }
  if (body.startsWith("Yeni saat: ")) {
    const time = body.replace(/^Yeni saat:\s*/, "");
    body = t("templates.appointmentRescheduledBody", { time });
  }

  // 5. Rate consultation
  if (title === "Görüşmeni değerlendir") {
    title = t("templates.rateConsultation");
  }
  if (body.includes(" ile görüşmen tamamlandı. Deneyimini Alumas'ta paylaşabilirsin.")) {
    const doc = body.replace(/\s+ile görüşmen tamamlandı\. Deneyimini Alumas'ta paylaşabilirsin\.$/, "");
    body = t("templates.rateConsultationBody", { name: doc });
  }

  // 6. Diagnostic request
  if (title === "Yeni tetkik isteği") {
    title = t("templates.diagnosticRequest");
  }

  // 7. Care plan
  if (title === "Yeni bakım planı") {
    title = t("templates.carePlan");
  }

  // 8. Home care
  if (title === "Evde hizmet talebi") {
    title = t("templates.homeCareRequest");
  }
  if (title === "Evde numune talebi") {
    title = t("templates.homeSampleRequest");
  }

  // 9. Family invite
  if (title === "Aile profili daveti") {
    title = t("templates.familyInvite");
  }
  const familyMatch = body.match(/^(.*?) sizi (?:["']?)(.*?)(?:["']?) adlı aile profiline davet etti\.$/);
  if (familyMatch) {
    body = t("templates.familyInviteBody", { name: familyMatch[1], profile: familyMatch[2] });
  }

  // 10. Lab comment
  if (title === "Laboratuvar sonucuna doktor yorumu") {
    title = t("templates.labComment");
  }
  const labCommentMatch = body.match(/^(.*?), (.*?) sonucuna bir yorum ekledi\.$/);
  if (labCommentMatch) {
    body = t("templates.labCommentBody", { doctor: labCommentMatch[1], test: labCommentMatch[2] });
  }

  // 11. Lab result
  if (title === "Yeni tahlil sonucu") {
    title = t("templates.labResult");
  }

  // 12. Imaging result
  if (title === "Yeni görüntüleme sonucu") {
    title = t("templates.imagingResult");
  }

  return { title, body };
}

export default function Notifications() {
  const t = useTranslations('notifications');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-US' : 'tr-TR';
  const [items, setItems] = useState<N[]>([]);
  const router = useRouter();
  
  const load = () => fetch('/api/notifications').then(r => r.ok ? r.json() : []).then(setItems);
  useEffect(() => { load() }, []);

  async function mark() {
    await fetch('/api/notifications', { method: 'PATCH' });
    load();
  }

  const getIcon = (kind: string, read: boolean) => {
    const color = read ? "#94a3b8" : "#0284c7";
    switch(kind) {
      case 'appointment': return <CalendarCheck size={24} weight={read ? "regular" : "duotone"} color={color} />;
      case 'reminder': return <Pill size={24} weight={read ? "regular" : "duotone"} color={read ? "#94a3b8" : "#16a34a"} />;
      case 'message': return <ChatsCircle size={24} weight={read ? "regular" : "duotone"} color={read ? "#94a3b8" : "#8b5cf6"} />;
      case 'clinical': return <Stethoscope size={24} weight={read ? "regular" : "duotone"} color={read ? "#94a3b8" : "#db2777"} />;
      default: return <Info size={24} weight={read ? "regular" : "duotone"} color={color} />;
    }
  };

  const getUrlForKind = (kind: string) => {
    switch(kind) {
      case 'message': return '/messages';
      case 'appointment': return '/appointments';
      case 'reminder': return '/calendar';
      case 'clinical': return '/health/timeline';
      case 'family': return '/health/family-hub';
      case 'homecare': return '/home-care';
      default: return '/notifications';
    }
  };

  const handleNotificationClick = async (n: N) => {
    // 1. Mark as read immediately if unread
    if (!n.readAt) {
      setItems(prev => prev.map(item => item.id === n.id ? { ...item, readAt: new Date().toISOString() } : item));
      await fetch(`/api/notifications/${n.id}`, { method: 'PATCH' }).catch(() => null);
    }
    
    // 2. Navigate to appropriate page
    const url = getUrlForKind(n.kind);
    if (url !== '/notifications') {
      router.push(url);
    }
  };

  return (
    <div className="page" style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "32px" }}>
        <Link href="/services" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#64748b", textDecoration: "none", fontSize: "14px", fontWeight: 500, marginBottom: "16px" }}>
          <CaretLeft size={16} /> {t('backToServices')}
        </Link>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <span className="kicker">{t('kicker')}</span>
            <h1 style={{ fontSize: "28px", color: "#0f172a", margin: "8px 0" }}>{t('title')}</h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "15px" }}>{t('subtitle')}</p>
          </div>
          {items.some(n => !n.readAt) && (
            <button onClick={mark} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "100px", border: "1px solid #cbd5e1", background: "#fff", color: "#475569", fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }} className="hover-shadow">
              <Checks size={18} /> {t('markAllRead')}
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {items.map(n => {
          const loc = localizeNotification(n, t, locale);
          return (
            <div 
              key={n.id} 
              onClick={() => handleNotificationClick(n)}
              style={{ 
                display: "flex", 
                gap: "16px", 
                padding: "20px", 
                background: n.readAt ? "#f8fafc" : "#fff", 
                borderRadius: "20px", 
                border: "1px solid", 
                borderColor: n.readAt ? "#e2e8f0" : "#bae6fd", 
                opacity: n.readAt ? 0.7 : 1, 
                position: "relative", 
                overflow: "hidden", 
                transition: "all 0.2s", 
                boxShadow: n.readAt ? "none" : "0 4px 6px -1px rgba(2,132,199,0.05)",
                cursor: "pointer"
              }} 
              className="hover-scale"
            >
              {!n.readAt && <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "4px", background: "#0284c7" }} />}
              
              <div style={{ padding: "12px", background: n.readAt ? "#f1f5f9" : "#e0f2fe", borderRadius: "16px", height: "fit-content" }}>
                {getIcon(n.kind, !!n.readAt)}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "6px" }}>
                  <strong style={{ fontSize: "16px", color: n.readAt ? "#64748b" : "#0f172a", lineHeight: "1.4" }}>{loc.title}</strong>
                  <span style={{ fontSize: "12px", color: "#94a3b8", whiteSpace: "nowrap", fontWeight: 500 }}>
                    {new Date(n.createdAt).toLocaleString(dateLocale, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p style={{ margin: 0, color: n.readAt ? "#94a3b8" : "#475569", fontSize: "15px", lineHeight: "1.5" }}>{loc.body}</p>
              </div>
            </div>
          );
        })}

        {!items.length && (
          <div style={{ padding: "64px 32px", textAlign: "center", background: "#f8fafc", borderRadius: "24px", border: "1px dashed #cbd5e1", color: "#64748b" }}>
            <BellRinging size={64} weight="duotone" color="#cbd5e1" style={{ margin: "0 auto 16px" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a", fontSize: "18px" }}>{t('emptyTitle')}</h3>
            <p style={{ margin: 0, fontSize: "15px" }}>{t('emptyDesc')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
