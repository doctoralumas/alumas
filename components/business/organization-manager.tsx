"use client";

import { useState } from "react";
import { IMAGING_MODALITIES, LAB_CATEGORIES, LAB_SAMPLE_TYPES, imagingModalityLabel, labCategoryLabel, labSampleLabel } from "@/lib/organization-capabilities";
import ResultDelivery from "@/components/business/result-delivery";

type Props = { org: any };
const days = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
const panelCopy: Record<string, string> = {
  HOSPITAL: "Departmanları, uzman kadroyu, acil birimleri ve klinik hizmetleri buradan yönetirsiniz. Yayınlanan profil bu kayıtları gösterir.",
  CLINIC: "Uzman kadroyu, muayene ve işlemleri buradan yönetirsiniz. Yayınlanan profil bu kayıtları gösterir.",
  PHARMACY: "Nöbet durumunu ve stok görünürlüğünü buradan yönetirsiniz. Hastalar adet yerine stok durumunu görür.",
  IMAGING_CENTER: "MR, BT, röntgen ve diğer tetkikleri buradan yönetirsiniz. Raporu, ilişkili hastanın görüntüleme geçmişine işlersiniz.",
  LABORATORY: "Kan, idrar ve diğer numune tahlillerini buradan yönetirsiniz. Sonucu, ilişkili hastanın tahlil geçmişine işlersiniz.",
};

const emptyExam = {
  modality: "MR",
  name: "",
  bodyRegion: "",
  preparation: "",
  durationMinutes: "",
  reportHours: "",
  price: "",
};

const stockLabels: Record<string, string> = { in_stock: "Stokta var", limited: "Sınırlı", out_of_stock: "Yok" };
const emergencyLabels: Record<string, string> = {
  EMERGENCY_DEPARTMENT: "Acil servis",
  EMERGENCY_CONSULT: "Acil danışmanlık",
  AMBULANCE_COORDINATION: "Ambulans koordinasyonu",
  EMERGENCY: "Acil",
};

const emptyTest = {
  category: "BIYOKIMYA",
  sampleType: "KAN",
  name: "",
  fastingHours: "",
  turnaroundHours: "",
  preparation: "",
  price: "",
};

export default function OrganizationManager({ org }: Props) {
  const clinical = org.type === "HOSPITAL" || org.type === "CLINIC";
  const hospital = org.type === "HOSPITAL";
  const pharmacy = org.type === "PHARMACY";
  const imaging = org.type === "IMAGING_CENTER";
  const laboratory = org.type === "LABORATORY";

  const [services, setServices] = useState<any[]>((org.services || []).filter((item: any) => item.isActive !== false));
  const [hours, setHours] = useState<any[]>(org.hours || []);
  const [invites, setInvites] = useState<any[]>(org.doctorInvites || []);
  const [msg, setMsg] = useState("");
  const [stock, setStock] = useState<any[]>(org.stocks || []);
  const [onDuty, setOnDuty] = useState(!!org.isOnDuty);
  const [onDutyUntil, setOnDutyUntil] = useState(org.onDutyUntil ? new Date(org.onDutyUntil).toISOString().slice(0, 16) : "");
  const [departments, setDepartments] = useState<any[]>((org.departments || []).filter((item: any) => item.isActive !== false));
  const [campaigns, setCampaigns] = useState<any[]>(org.campaigns || []);
  const [doctors, setDoctors] = useState<any[]>(org.doctors || []);
  const [emergencyServices, setEmergencyServices] = useState<any[]>((org.emergencyServices || []).filter((item: any) => item.isActive !== false));
  const [exams, setExams] = useState<any[]>(org.imagingExams || []);
  const [examForm, setExamForm] = useState(emptyExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>(org.laboratoryTests || []);
  const [testForm, setTestForm] = useState(emptyTest);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  async function addDepartment(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/departments`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), floor: f.get("floor"), phone: f.get("phone"), description: f.get("description") }) });
    const j = await r.json();
    if (r.ok) { setDepartments((x) => [...x, j]); form.reset(); setMsg("Departman eklendi"); }
    else setMsg(j.error);
  }
  async function assignDepartment(doctorId: string, departmentId: string) {
    const r = await fetch(`/api/organizations/${org.id}/doctor-department`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ doctorId, departmentId: departmentId || null }) });
    if (r.ok) { setDoctors((x) => x.map((d) => d.id === doctorId ? { ...d, departmentId: departmentId || null } : d)); setMsg("Doktor departmanı güncellendi"); }
    else setMsg("Departman atanamadı");
  }
  async function addCampaign(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/campaigns`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: f.get("title"), description: f.get("description"), startsAt: f.get("startsAt") || null, endsAt: f.get("endsAt") || null }) });
    const j = await r.json();
    if (r.ok) { setCampaigns((x) => [j, ...x]); form.reset(); setMsg("Kampanya eklendi"); }
    else setMsg(j.error);
  }
  async function addVariant(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/service-variants`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ serviceId: f.get("serviceId"), label: f.get("label"), priceDelta: f.get("priceDelta"), durationMinutes: f.get("durationMinutes") }) });
    const j = await r.json();
    if (r.ok) { setServices((x) => x.map((s) => s.id === j.serviceId ? { ...s, variants: [...(s.variants || []), j] } : s)); form.reset(); setMsg("Varyant eklendi"); }
    else setMsg(j.error);
  }
  async function addEmergencyService(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/emergency-services`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), kind: f.get("kind"), phone: f.get("phone"), is24Hours: f.get("is24Hours") === "on", description: f.get("description") }) });
    const j = await r.json();
    if (r.ok) { setEmergencyServices((x) => [...x, j]); form.reset(); setMsg("Acil hizmet eklendi"); }
    else setMsg(j.error);
  }
  async function addService(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/services`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: f.get("name"), description: f.get("description"), price: f.get("price") }) });
    const j = await r.json();
    if (r.ok) { setServices((x) => [...x, j]); form.reset(); setMsg(clinical && org.type === "CLINIC" ? "İşlem eklendi" : "Hizmet eklendi"); }
    else setMsg(j.error);
  }
  async function invite(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/invites`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: f.get("email"), specialty: f.get("specialty") }) });
    const j = await r.json();
    if (r.ok) { setInvites((x) => [j, ...x]); form.reset(); setMsg("Doktor daveti gönderildi"); }
    else setMsg(j.error);
  }
  async function saveHours() {
    const payload = days.map((_, weekday) => {
      const row = hours.find((h: any) => h.weekday === weekday) || {};
      return { weekday, isClosed: !!row.isClosed, opensAt: row.opensAt || "09:00", closesAt: row.closesAt || "18:00" };
    });
    const r = await fetch(`/api/organizations/${org.id}/hours`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ hours: payload }) });
    setMsg(r.ok ? "Çalışma saatleri kaydedildi" : "Saatler kaydedilemedi");
  }
  function updateHour(day: number, key: string, value: any) {
    setHours((prev: any[]) => {
      const rest = prev.filter((h) => h.weekday !== day);
      const old = prev.find((h) => h.weekday === day) || { weekday: day, opensAt: "09:00", closesAt: "18:00", isClosed: false };
      return [...rest, { ...old, [key]: value }];
    });
  }
  async function locate() {
    setMsg("Konum aranıyor...");
    const r = await fetch("/api/maps/geocode", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query: `${org.address}, ${org.district || ""}, ${org.city}, Türkiye` }) });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || "Konum bulunamadı"); return; }
    const u = await fetch(`/api/organizations/${org.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(j) });
    setMsg(u.ok ? "Harita konumu kaydedildi" : "Konum kaydedilemedi");
  }
  async function saveDuty() {
    const r = await fetch(`/api/organizations/${org.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isOnDuty: onDuty, onDutyUntil: onDuty && onDutyUntil ? new Date(onDutyUntil).toISOString() : null }) });
    setMsg(r.ok ? "Nöbetçi durumu güncellendi" : "Nöbetçi durumu kaydedilemedi");
  }
  async function addStock(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/${org.id}/stock`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ itemName: f.get("itemName"), stockStatus: f.get("stockStatus"), quantity: f.get("quantity") }) });
    const j = await r.json();
    if (r.ok) { setStock((x) => [...x.filter((s) => s.itemName !== j.itemName), j]); form.reset(); setMsg("Stok güncellendi"); }
    else setMsg(j.error);
  }
  function editExam(exam: any) {
    setEditingExamId(exam.id);
    setExamForm({
      modality: exam.modality,
      name: exam.name || "",
      bodyRegion: exam.bodyRegion || "",
      preparation: exam.preparation || "",
      durationMinutes: exam.durationMinutes ?? "",
      reportHours: exam.reportHours ?? "",
      price: exam.price ?? "",
    });
  }
  async function saveExam(e: any) {
    e.preventDefault();
    const payload = { ...examForm, examId: editingExamId };
    const r = await fetch(`/api/organizations/${org.id}/imaging-exams`, {
      method: editingExamId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || "Tetkik kaydedilemedi"); return; }
    setExams((current) => editingExamId ? current.map((item) => item.id === j.id ? j : item) : [...current, j]);
    setExamForm(emptyExam);
    setEditingExamId(null);
    setMsg(editingExamId ? "Tetkik güncellendi" : "Tetkik kataloğa eklendi");
  }
  async function removeExam(id: string) {
    const r = await fetch(`/api/organizations/${org.id}/imaging-exams?examId=${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || "Tetkik kaldırılamadı"); return; }
    setExams((current) => current.filter((item) => item.id !== id));
    if (editingExamId === id) { setEditingExamId(null); setExamForm(emptyExam); }
    setMsg("Tetkik yayından kaldırıldı");
  }
  function editTest(test: any) {
    setEditingTestId(test.id);
    setTestForm({
      category: test.category,
      sampleType: test.sampleType,
      name: test.name || "",
      fastingHours: test.fastingHours ?? "",
      turnaroundHours: test.turnaroundHours ?? "",
      preparation: test.preparation || "",
      price: test.price ?? "",
    });
  }
  async function saveTest(e: any) {
    e.preventDefault();
    const payload = { ...testForm, testId: editingTestId };
    const r = await fetch(`/api/organizations/${org.id}/laboratory-tests`, {
      method: editingTestId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || "Tahlil kaydedilemedi"); return; }
    setTests((current) => editingTestId ? current.map((item) => item.id === j.id ? j : item) : [...current, j]);
    setTestForm(emptyTest);
    setEditingTestId(null);
    setMsg(editingTestId ? "Tahlil güncellendi" : "Tahlil kataloğa eklendi");
  }
  async function removeTest(id: string) {
    const r = await fetch(`/api/organizations/${org.id}/laboratory-tests?testId=${id}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg(j.error || "Tahlil kaldırılamadı"); return; }
    setTests((current) => current.filter((item) => item.id !== id));
    if (editingTestId === id) { setEditingTestId(null); setTestForm(emptyTest); }
    setMsg("Tahlil yayından kaldırıldı");
  }
  async function updateService(event: React.FormEvent<HTMLFormElement>, serviceId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/organizations/${org.id}/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, name: form.get("name"), description: form.get("description"), price: form.get("price") }),
    });
    const data = await response.json();
    if (!response.ok) { setMsg(data.error || "Hizmet güncellenemedi"); return; }
    setServices((current) => current.map((item) => item.id === data.id ? { ...item, ...data } : item));
    setMsg("Hizmet güncellendi");
  }
  async function hideService(serviceId: string) {
    const response = await fetch(`/api/organizations/${org.id}/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, isActive: false }),
    });
    if (!response.ok) { setMsg("Hizmet kaldırılamadı"); return; }
    setServices((current) => current.filter((item) => item.id !== serviceId));
    setMsg("Hizmet yayından kaldırıldı");
  }
  async function hideVariant(serviceId: string, variantId: string) {
    const response = await fetch(`/api/organizations/${org.id}/service-variants`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ variantId, isActive: false }),
    });
    if (!response.ok) { setMsg("Varyant kaldırılamadı"); return; }
    setServices((current) => current.map((item) => item.id === serviceId ? { ...item, variants: (item.variants || []).filter((variant: any) => variant.id !== variantId) } : item));
    setMsg("Varyant kaldırıldı");
  }
  async function updateDepartment(event: React.FormEvent<HTMLFormElement>, departmentId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/organizations/${org.id}/departments`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ departmentId, name: form.get("name"), floor: form.get("floor"), phone: form.get("phone"), description: form.get("description") }),
    });
    const data = await response.json();
    if (!response.ok) { setMsg(data.error || "Departman güncellenemedi"); return; }
    setDepartments((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg("Departman güncellendi");
  }
  async function hideDepartment(departmentId: string) {
    const response = await fetch(`/api/organizations/${org.id}/departments`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ departmentId, isActive: false }),
    });
    if (!response.ok) { setMsg("Departman kaldırılamadı"); return; }
    setDepartments((current) => current.filter((item) => item.id !== departmentId));
    setDoctors((current) => current.map((doctor) => doctor.departmentId === departmentId ? { ...doctor, departmentId: null } : doctor));
    setMsg("Departman yayından kaldırıldı");
  }
  async function updateEmergency(event: React.FormEvent<HTMLFormElement>, emergencyId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/organizations/${org.id}/emergency-services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        emergencyId,
        name: form.get("name"),
        kind: form.get("kind"),
        phone: form.get("phone"),
        is24Hours: form.get("is24Hours") === "on",
        description: form.get("description"),
      }),
    });
    const data = await response.json();
    if (!response.ok) { setMsg(data.error || "Acil hizmet güncellenemedi"); return; }
    setEmergencyServices((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg("Acil hizmet güncellendi");
  }
  async function hideEmergency(emergencyId: string) {
    const response = await fetch(`/api/organizations/${org.id}/emergency-services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emergencyId, isActive: false }),
    });
    if (!response.ok) { setMsg("Acil hizmet kaldırılamadı"); return; }
    setEmergencyServices((current) => current.filter((item) => item.id !== emergencyId));
    setMsg("Acil hizmet yayından kaldırıldı");
  }
  async function updateStock(stockId: string, stockStatus: string) {
    const response = await fetch(`/api/organizations/${org.id}/stock`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stockId, stockStatus }),
    });
    const data = await response.json();
    if (!response.ok) { setMsg(data.error || "Stok güncellenemedi"); return; }
    setStock((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg("Stok durumu güncellendi");
  }
  async function removeStock(stockId: string) {
    const response = await fetch(`/api/organizations/${org.id}/stock?stockId=${stockId}`, { method: "DELETE" });
    if (!response.ok) { setMsg("Stok kaydı kaldırılamadı"); return; }
    setStock((current) => current.filter((item) => item.id !== stockId));
    setMsg("Stok kaydı kaldırıldı");
  }

  return (
    <>
      <p className="muted" style={{ marginTop: 0 }}>{panelCopy[org.type] || "Kurum bilgilerini buradan yönetirsiniz."}</p>
      {imaging && <ResultDelivery organizationId={org.id} kind="imaging" catalog={exams.map((exam) => ({ id: exam.id, name: `${imagingModalityLabel(exam.modality)} · ${exam.name}` }))} />}
      {laboratory && <ResultDelivery organizationId={org.id} kind="laboratory" catalog={tests.map((test) => ({ id: test.id, name: `${labCategoryLabel(test.category)} · ${test.name}` }))} />}
      <div className="business-manage-grid">
        <section className="panel form-span">
          <div className="row between">
            <div><h2>Konum</h2><p>{org.address} · {org.city}</p></div>
            <button className="secondary" onClick={locate}>Adresten harita konumu bul</button>
          </div>
          <small className="muted">Hastalarınızın kurumunuzu haritada daha kolay bulabilmesi için konumunuzu doğrulayın.</small>
        </section>
        {msg && <div className="inline-message form-span">{msg}</div>}

        {clinical && (
          <section className="panel">
            <h2>{org.type === "CLINIC" ? "Muayene ve işlemler" : "Klinik hizmetler"}</h2>
            <form className="compact-form" onSubmit={addService}>
              <input name="name" placeholder={org.type === "CLINIC" ? "Muayene veya işlem adı" : "Hizmet adı"} required />
              <input name="price" type="number" min="0" placeholder="Fiyat (₺)" />
              <input name="description" placeholder="Kısa açıklama" />
              <button className="primary">Ekle</button>
            </form>
            <div className="slot-list">
              {services.map((s) => (
                <div className="slot-row" key={s.id}>
                  <form onSubmit={(event) => updateService(event, s.id)} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", width: "100%" }}>
                    <input name="name" defaultValue={s.name} required />
                    <input name="price" type="number" min="0" defaultValue={s.price ?? ""} placeholder="Fiyat (₺)" />
                    <input name="description" defaultValue={s.description || ""} placeholder="Kısa açıklama" />
                    <button className="secondary" type="submit">Kaydet</button>
                    <button className="secondary" type="button" onClick={() => hideService(s.id)}>Kaldır</button>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}

        {clinical && (
          <section className="panel">
            <h2>Hizmet varyantları</h2>
            <form className="compact-form" onSubmit={addVariant}>
              <select name="serviceId" required>
                <option value="">Hizmet seç</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input name="label" placeholder="Online / 60 dk / Premium" required />
              <input name="priceDelta" type="number" placeholder="Ek fiyat (₺)" />
              <input name="durationMinutes" type="number" placeholder="Süre (dk)" />
              <button className="primary">Varyant ekle</button>
            </form>
            <div className="slot-list">
              {services.flatMap((s) => (s.variants || []).filter((variant: any) => variant.isActive !== false).map((v: any) => (
                <div className="slot-row" key={v.id}>
                  <div><b>{s.name} · {v.label}</b><span>{v.durationMinutes ? `${v.durationMinutes} dk` : ""}{v.priceDelta ? ` · +${v.priceDelta} ₺` : ""}</span></div>
                  <button type="button" className="secondary" onClick={() => hideVariant(s.id, v.id)}>Kaldır</button>
                </div>
              )))}
            </div>
          </section>
        )}

        {clinical && (
          <section className="panel">
            <h2>Doktor davetleri</h2>
            <form className="compact-form" onSubmit={invite}>
              <input name="email" type="email" placeholder="doktor@ornek.com" required />
              <input name="specialty" placeholder="Branş (opsiyonel)" />
              <button className="primary">Davet gönder</button>
            </form>
            <div className="slot-list">
              {invites.map((i) => (
                <div className="slot-row" key={i.id}><div><b>{i.email}</b><span>{i.specialty || "Doktor"} · {i.status}</span></div></div>
              ))}
            </div>
          </section>
        )}

        <section className="panel form-span">
          <div className="row between">
            <div><h2>Çalışma saatleri</h2><p>Kuruma göre haftalık açılış ve kapanış.</p></div>
            <button className="secondary" onClick={saveHours}>Kaydet</button>
          </div>
          <div className="hours-grid">
            {days.map((d, weekday) => {
              const h = hours.find((x: any) => x.weekday === weekday) || { opensAt: "09:00", closesAt: "18:00", isClosed: false };
              return (
                <div className="hours-row" key={d}>
                  <b>{d}</b>
                  <label><input type="checkbox" checked={!!h.isClosed} onChange={(e) => updateHour(weekday, "isClosed", e.target.checked)} /> Kapalı</label>
                  <input type="time" disabled={h.isClosed} value={h.opensAt || "09:00"} onChange={(e) => updateHour(weekday, "opensAt", e.target.value)} />
                  <input type="time" disabled={h.isClosed} value={h.closesAt || "18:00"} onChange={(e) => updateHour(weekday, "closesAt", e.target.value)} />
                </div>
              );
            })}
          </div>
        </section>

        {hospital && (
          <section className="panel form-span">
            <h2>Branşlar ve departmanlar</h2>
            <p>Uzmanları hastane departmanlarına bağlayın.</p>
            <form className="compact-form" onSubmit={addDepartment}>
              <input name="name" placeholder="Kardiyoloji" required />
              <input name="floor" placeholder="Kat / bölüm" />
              <input name="phone" placeholder="Dahili telefon" />
              <input name="description" placeholder="Kısa açıklama" />
              <button className="primary">Departman ekle</button>
            </form>
            <div className="slot-list">
              {departments.map((d) => (
                <form className="slot-row" key={d.id} onSubmit={(event) => updateDepartment(event, d.id)}>
                  <input name="name" defaultValue={d.name} required />
                  <input name="floor" defaultValue={d.floor || ""} placeholder="Kat" />
                  <input name="phone" defaultValue={d.phone || ""} placeholder="Telefon" />
                  <input name="description" defaultValue={d.description || ""} placeholder="Açıklama" />
                  <button className="secondary" type="submit">Kaydet</button>
                  <button className="secondary" type="button" onClick={() => hideDepartment(d.id)}>Kaldır</button>
                </form>
              ))}
            </div>
            {doctors.length > 0 && (
              <div className="slot-list">
                {doctors.map((d) => (
                  <div className="slot-row" key={d.id}>
                    <div><b>{d.name}</b><span>{d.specialty}</span></div>
                    <select value={d.departmentId || ""} onChange={(e) => assignDepartment(d.id, e.target.value)}>
                      <option value="">Departmansız</option>
                      {departments.map((dep) => <option value={dep.id} key={dep.id}>{dep.name}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <section className="panel form-span">
          <h2>Kampanyalar</h2>
          <p>Onaylı kurum profilinde ve Alumas Kampanyalar sayfasında gösterilir.</p>
          <form className="v25-campaign-form" onSubmit={addCampaign}>
            <input name="title" placeholder="Kampanya başlığı" required />
            <input name="startsAt" type="date" />
            <input name="endsAt" type="date" />
            <textarea name="description" placeholder="Kısa açıklama" />
            <button className="primary">Yayınla</button>
          </form>
          <div className="slot-list">
            {campaigns.map((c) => (
              <div className="slot-row" key={c.id}><div><b>{c.title}</b><span>{c.description || "Açıklama yok"}</span></div><small>{c.isActive ? "Aktif" : "Pasif"}</small></div>
            ))}
          </div>
        </section>

        {hospital && (
          <section className="panel form-span">
            <h2>Acil hizmetler</h2>
            <p>Acil servis, danışma hattı veya 7/24 birimler.</p>
            <form className="compact-form" onSubmit={addEmergencyService}>
              <input name="name" placeholder="Acil Servis" required />
              <select name="kind">
                <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                <option value="AMBULANCE_COORDINATION">Ambulans koordinasyonu</option>
              </select>
              <input name="phone" placeholder="Telefon" />
              <label className="row"><input name="is24Hours" type="checkbox" /> 7/24</label>
              <input name="description" placeholder="Açıklama" />
              <button className="primary">Ekle</button>
            </form>
            <div className="slot-list">
              {emergencyServices.map((item: any) => (
                <form className="slot-row" key={item.id} onSubmit={(event) => updateEmergency(event, item.id)}>
                  <input name="name" defaultValue={item.name} required />
                  <select name="kind" defaultValue={item.kind}>
                    <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                    <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                    <option value="AMBULANCE_COORDINATION">Ambulans koordinasyonu</option>
                  </select>
                  <input name="phone" defaultValue={item.phone || ""} placeholder="Telefon" />
                  <label className="row"><input name="is24Hours" type="checkbox" defaultChecked={!!item.is24Hours} /> 7/24</label>
                  <button className="secondary" type="submit">Kaydet</button>
                  <button className="secondary" type="button" onClick={() => hideEmergency(item.id)}>Kaldır</button>
                  <small>{emergencyLabels[item.kind] || item.kind}</small>
                </form>
              ))}
            </div>
          </section>
        )}

        {pharmacy && (
          <>
            <section className="panel form-span">
              <div className="row between">
                <div><h2>Nöbetçi eczane</h2><p>Bu bilgi nöbetçi eczane filtresinde görünür.</p></div>
                <button className="secondary" onClick={saveDuty}>Kaydet</button>
              </div>
              <div className="compact-form">
                <label className="row"><input type="checkbox" checked={onDuty} onChange={(e) => setOnDuty(e.target.checked)} /> Nöbetçi</label>
                <input type="datetime-local" disabled={!onDuty} value={onDutyUntil} onChange={(e) => setOnDutyUntil(e.target.value)} />
              </div>
            </section>
            <section className="panel form-span">
              <h2>Eczane stok yönetimi</h2>
              <p>Kullanıcılara adet yerine yalnızca stok durumu gösterilir.</p>
              <form className="compact-form" onSubmit={addStock}>
                <input name="itemName" placeholder="Ürün / ilaç adı" required />
                <select name="stockStatus">
                  <option value="in_stock">Stokta var</option>
                  <option value="limited">Sınırlı</option>
                  <option value="out_of_stock">Yok</option>
                </select>
                <input name="quantity" type="number" min="0" placeholder="Adet (kurum içi)" />
                <button className="primary">Güncelle</button>
              </form>
              <div className="slot-list">
                {stock.map((s) => (
                  <div className="slot-row" key={s.id}>
                    <b>{s.itemName}</b>
                    <select value={s.stockStatus} onChange={(event) => updateStock(s.id, event.target.value)}>
                      <option value="in_stock">Stokta var</option>
                      <option value="limited">Sınırlı</option>
                      <option value="out_of_stock">Yok</option>
                    </select>
                    <span>{stockLabels[s.stockStatus] || s.stockStatus}</span>
                    <button type="button" className="secondary" onClick={() => removeStock(s.id)}>Kaldır</button>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

        {imaging && (
          <section className="panel form-span">
            <h2>Tetkik kataloğu</h2>
            <p>Hasta sayfasında tür, bölge, hazırlık, çekim süresi, rapor süresi ve fiyat görünür.</p>
            <form className="compact-form" onSubmit={saveExam}>
              <select value={examForm.modality} onChange={(e) => setExamForm({ ...examForm, modality: e.target.value })}>
                {IMAGING_MODALITIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <input value={examForm.name} onChange={(e) => setExamForm({ ...examForm, name: e.target.value })} placeholder="Tetkik adı, örn. Beyin MR" required />
              <input value={examForm.bodyRegion} onChange={(e) => setExamForm({ ...examForm, bodyRegion: e.target.value })} placeholder="Bölge, örn. Baş" />
              <input value={examForm.preparation} onChange={(e) => setExamForm({ ...examForm, preparation: e.target.value })} placeholder="Hazırlık, örn. 4 saat açlık" />
              <input value={examForm.durationMinutes} onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })} type="number" min="0" placeholder="Çekim süresi (dk)" />
              <input value={examForm.reportHours} onChange={(e) => setExamForm({ ...examForm, reportHours: e.target.value })} type="number" min="0" placeholder="Rapor süresi (saat)" />
              <input value={examForm.price} onChange={(e) => setExamForm({ ...examForm, price: e.target.value })} type="number" min="0" placeholder="Fiyat (₺)" />
              <button className="primary">{editingExamId ? "Tetkiği güncelle" : "Kataloğa ekle"}</button>
              {editingExamId && <button type="button" className="secondary" onClick={() => { setEditingExamId(null); setExamForm(emptyExam); }}>Vazgeç</button>}
            </form>
            <div className="slot-list">
              {exams.map((exam) => (
                <div className="slot-row" key={exam.id}>
                  <div>
                    <b>{imagingModalityLabel(exam.modality)} · {exam.name}</b>
                    <span>{[exam.bodyRegion, exam.preparation, exam.durationMinutes ? `${exam.durationMinutes} dk` : "", exam.reportHours ? `rapor ${exam.reportHours} sa` : ""].filter(Boolean).join(" · ") || "Ayrıntı yok"}</span>
                  </div>
                  <div className="row">
                    <strong>{exam.price ? `${exam.price.toLocaleString("tr-TR")} ₺` : "Fiyat sorunuz"}</strong>
                    <button type="button" className="secondary" onClick={() => editExam(exam)}>Düzenle</button>
                    <button type="button" className="secondary" onClick={() => removeExam(exam.id)}>Kaldır</button>
                  </div>
                </div>
              ))}
              {!exams.length && <div className="empty">Henüz tetkik yok.</div>}
            </div>
          </section>
        )}

        {laboratory && (
          <section className="panel form-span">
            <h2>Tahlil kataloğu</h2>
            <p>Hasta sayfasında grup, numune, açlık, sonuç süresi ve fiyat görünür.</p>
            <form className="compact-form" onSubmit={saveTest}>
              <select value={testForm.category} onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}>
                {LAB_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <select value={testForm.sampleType} onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}>
                {LAB_SAMPLE_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
              <input value={testForm.name} onChange={(e) => setTestForm({ ...testForm, name: e.target.value })} placeholder="Tahlil adı, örn. Hemogram" required />
              <input value={testForm.fastingHours} onChange={(e) => setTestForm({ ...testForm, fastingHours: e.target.value })} type="number" min="0" placeholder="Açlık (saat), boşsa gerekmez" />
              <input value={testForm.turnaroundHours} onChange={(e) => setTestForm({ ...testForm, turnaroundHours: e.target.value })} type="number" min="0" placeholder="Sonuç süresi (saat)" />
              <input value={testForm.preparation} onChange={(e) => setTestForm({ ...testForm, preparation: e.target.value })} placeholder="Hazırlık, örn. sabah numunesi" />
              <input value={testForm.price} onChange={(e) => setTestForm({ ...testForm, price: e.target.value })} type="number" min="0" placeholder="Fiyat (₺)" />
              <button className="primary">{editingTestId ? "Tahlili güncelle" : "Kataloğa ekle"}</button>
              {editingTestId && <button type="button" className="secondary" onClick={() => { setEditingTestId(null); setTestForm(emptyTest); }}>Vazgeç</button>}
            </form>
            <div className="slot-list">
              {tests.map((test) => (
                <div className="slot-row" key={test.id}>
                  <div>
                    <b>{labCategoryLabel(test.category)} · {test.name}</b>
                    <span>{[labSampleLabel(test.sampleType), test.fastingHours ? `${test.fastingHours} saat açlık` : "Açlık gerekmez", test.turnaroundHours ? `sonuç ${test.turnaroundHours} sa` : "", test.preparation].filter(Boolean).join(" · ")}</span>
                  </div>
                  <div className="row">
                    <strong>{test.price ? `${test.price.toLocaleString("tr-TR")} ₺` : "Fiyat sorunuz"}</strong>
                    <button type="button" className="secondary" onClick={() => editTest(test)}>Düzenle</button>
                    <button type="button" className="secondary" onClick={() => removeTest(test.id)}>Kaldır</button>
                  </div>
                </div>
              ))}
              {!tests.length && <div className="empty">Henüz tahlil yok.</div>}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
