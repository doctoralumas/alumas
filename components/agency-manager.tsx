"use client";

import { useState } from "react";
import VerificationDocumentManager from "@/components/verification-document-manager";

const serviceKinds = [
  ["TRANSFER", "Transfer"],
  ["ACCOMMODATION", "Konaklama"],
  ["TRANSLATION", "Tercüman"],
  ["COORDINATION", "Koordinasyon"],
  ["REFERRAL", "Partner yönlendirme"],
] as const;

const kindLabel = Object.fromEntries(serviceKinds) as Record<string, string>;

export default function AgencyManager({ agency }: { agency: any }) {
  const [services, setServices] = useState<any[]>(agency.services || []);
  const [packages, setPackages] = useState<any[]>(agency.packages || []);
  const [msg, setMsg] = useState("");
  const canPublish = agency.isVerified && agency.status === "APPROVED" && agency.isActive;

  async function addService(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const response = await fetch(`/api/agencies/${agency.id}/services`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Hizmet eklenemedi"); return; }
    setServices((current) => [data, ...current]);
    form.reset();
    setMsg("Hizmet eklendi");
  }

  async function saveService(event: React.FormEvent<HTMLFormElement>, serviceId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/agencies/${agency.id}/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, title: form.get("title"), kind: form.get("kind"), city: form.get("city"), description: form.get("description"), price: form.get("price") }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Hizmet güncellenemedi"); return; }
    setServices((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg("Hizmet güncellendi");
  }

  async function toggleService(service: any) {
    const response = await fetch(`/api/agencies/${agency.id}/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId: service.id, isActive: !service.isActive }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Hizmet durumu değişmedi"); return; }
    setServices((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg(data.isActive ? "Hizmet yayında" : "Hizmet yayından kaldırıldı");
  }

  async function addPackage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const raw: any = Object.fromEntries(new FormData(form));
    for (const key of ["transferIncluded", "accommodationIncluded", "airportPickup", "coordinatorSupport"]) raw[key] = raw[key] === "on";
    const response = await fetch(`/api/agencies/${agency.id}/packages`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(raw),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Paket eklenemedi"); return; }
    setPackages((current) => [data, ...current]);
    form.reset();
    setMsg(data.isPublished ? "Paket yayınlandı" : "Paket taslak olarak kaydedildi");
  }

  async function savePackage(event: React.FormEvent<HTMLFormElement>, packageId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/agencies/${agency.id}/packages`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        packageId,
        title: form.get("title"),
        category: form.get("category"),
        city: form.get("city"),
        providerName: form.get("providerName"),
        description: form.get("description"),
        languages: form.get("languages"),
        includes: form.get("includes"),
        startingPrice: form.get("startingPrice"),
        currency: form.get("currency"),
        transferIncluded: form.get("transferIncluded") === "on",
        accommodationIncluded: form.get("accommodationIncluded") === "on",
        airportPickup: form.get("airportPickup") === "on",
        coordinatorSupport: form.get("coordinatorSupport") === "on",
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Paket güncellenemedi"); return; }
    setPackages((current) => current.map((item) => item.id === data.id ? data : item));
    setMsg("Paket güncellendi");
  }

  async function togglePackage(item: any) {
    const response = await fetch(`/api/agencies/${agency.id}/packages`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ packageId: item.id, isPublished: !item.isPublished }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) { setMsg(data.error || "Paket durumu değişmedi"); return; }
    setPackages((current) => current.map((row) => row.id === data.id ? data : row));
    setMsg(data.isPublished ? "Paket yayında" : "Paket yayından kaldırıldı");
  }

  return (
    <div className="business-manage-grid">
      {!canPublish && <div className="inline-message form-span">Profil doğrulanmadan hizmetler ve paketler hasta sayfasında görünmez. Zorunlu belgeler onaylı ve süresi geçerli olmalıdır.</div>}
      <VerificationDocumentManager owner={{ kind: "agency", agencyId: agency.id }} documents={agency.verificationDocuments || []} />
      {msg && <div className="inline-message form-span">{msg}</div>}
      <section className="panel">
        <h2>Seyahat hizmeti ekle</h2>
        <p>Transfer, konaklama, tercüman ve koordinasyon. Hasta sayfası yalnızca yayındaki kayıtları gösterir.</p>
        <form className="compact-form" onSubmit={addService}>
          <select name="kind">{serviceKinds.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
          <input name="title" placeholder="Hizmet adı" required />
          <input name="city" placeholder="Şehir" />
          <input name="price" type="number" min="0" placeholder="Fiyat" />
          <button className="primary">Ekle</button>
        </form>
      </section>
      <section className="panel form-span">
        <h2>Yayınlanan hizmetler</h2>
        <div className="slot-list">
          {services.map((service) => (
            <form className="slot-row" key={service.id} onSubmit={(event) => saveService(event, service.id)}>
              <select name="kind" defaultValue={service.kind}>{serviceKinds.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>
              <input name="title" defaultValue={service.title} required />
              <input name="city" defaultValue={service.city || ""} placeholder="Şehir" />
              <input name="description" defaultValue={service.description || ""} placeholder="Açıklama" />
              <input name="price" type="number" min="0" defaultValue={service.price ?? ""} placeholder="Fiyat" />
              <small>{service.isActive ? "Yayında" : "Taslak"} · {kindLabel[service.kind] || service.kind}</small>
              <button className="secondary" type="submit">Kaydet</button>
              <button className="secondary" type="button" onClick={() => toggleService(service)}>{service.isActive ? "Yayından kaldır" : "Yayınla"}</button>
            </form>
          ))}
          {!services.length && <div className="empty">Henüz hizmet yok.</div>}
        </div>
      </section>
      <section className="panel form-span">
        <h2>Tedavi ve seyahat paketi</h2>
        <form className="business-form" onSubmit={addPackage}>
          <input name="title" placeholder="Paket adı" required />
          <div className="form-pair">
            <input name="category" placeholder="Kategori" required />
            <input name="city" placeholder="Şehir" required />
          </div>
          <input name="providerName" placeholder="Sağlık kurumu / sağlayıcı" required />
          <textarea name="description" placeholder="Açıklama" required />
          <input name="languages" placeholder="Diller: Türkçe, English" />
          <input name="includes" placeholder="Dahil: Muayene, transfer, otel" />
          <div className="form-pair">
            <input name="startingPrice" type="number" placeholder="Başlangıç fiyatı" />
            <select name="currency"><option>EUR</option><option>USD</option><option>TRY</option></select>
          </div>
          <div className="row wrap">
            <label><input type="checkbox" name="transferIncluded" /> Transfer</label>
            <label><input type="checkbox" name="accommodationIncluded" /> Konaklama</label>
            <label><input type="checkbox" name="airportPickup" /> Havalimanı</label>
            <label><input type="checkbox" name="coordinatorSupport" /> Koordinatör</label>
          </div>
          <button className="primary">Paket ekle</button>
        </form>
      </section>
      <section className="panel form-span">
        <h2>Paketler</h2>
        <div className="slot-list">
          {packages.map((item) => (
            <form className="slot-row" key={item.id} onSubmit={(event) => savePackage(event, item.id)}>
              <input name="title" defaultValue={item.title} required />
              <input name="category" defaultValue={item.category} required />
              <input name="city" defaultValue={item.city} required />
              <input name="providerName" defaultValue={item.providerName} required />
              <textarea name="description" defaultValue={item.description || ""} required />
              <input name="languages" defaultValue={(item.languages || []).join(", ")} placeholder="Diller" />
              <input name="includes" defaultValue={(item.includes || []).join(", ")} placeholder="Dahil olanlar" />
              <input name="startingPrice" type="number" defaultValue={item.startingPrice ?? ""} placeholder="Başlangıç fiyatı" />
              <select name="currency" defaultValue={item.currency || "EUR"}><option>EUR</option><option>USD</option><option>TRY</option></select>
              <label><input type="checkbox" name="transferIncluded" defaultChecked={item.transferIncluded} /> Transfer</label>
              <label><input type="checkbox" name="accommodationIncluded" defaultChecked={item.accommodationIncluded} /> Konaklama</label>
              <label><input type="checkbox" name="airportPickup" defaultChecked={item.airportPickup} /> Havalimanı</label>
              <label><input type="checkbox" name="coordinatorSupport" defaultChecked={item.coordinatorSupport} /> Koordinatör</label>
              <small>{item.isPublished ? "Yayında" : "Taslak"}</small>
              <button className="secondary" type="submit">Kaydet</button>
              <button className="secondary" type="button" onClick={() => togglePackage(item)}>{item.isPublished ? "Yayından kaldır" : "Yayınla"}</button>
            </form>
          ))}
          {!packages.length && <div className="empty">Henüz paket yok.</div>}
        </div>
      </section>
    </div>
  );
}
