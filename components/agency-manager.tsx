"use client";

import { useState } from "react";
import VerificationDocumentManager from "@/components/verification-document-manager";
import {
  Info,
  CaretDown,
  PencilSimple,
  Trash,
  Globe,
  AirplaneTilt,
  Bed,
  Handshake,
  ShieldCheck,
  MapPin,
} from "@phosphor-icons/react/dist/ssr";

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
  const canPublish =
    agency.isVerified && agency.status === "APPROVED" && agency.isActive;

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    kind: "TRANSFER",
    city: "",
    description: "",
    price: "",
  });

  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [packageForm, setPackageForm] = useState({
    title: "",
    category: "",
    city: "",
    providerName: "",
    description: "",
    languages: "",
    includes: "",
    startingPrice: "",
    currency: "EUR",
    transferIncluded: false,
    accommodationIncluded: false,
    airportPickup: false,
    coordinatorSupport: false,
  });

  async function saveGenelBilgiler(e: any) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get("name"),
      description: f.get("description"),
      phone: f.get("phone"),
      website: f.get("website"),
      city: f.get("city"),
      district: f.get("district"),
      address: f.get("address"),
    };
    const r = await fetch("/api/agencies/" + agency.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setMsg("Genel bilgiler güncellendi");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMsg("Bilgiler güncellenemedi");
    }
  }

  async function handleServiceSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { ...serviceForm, serviceId: editingServiceId };
    const response = await fetch(`/api/agencies/${agency.id}/services`, {
      method: editingServiceId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Hizmet kaydedilemedi");
      return;
    }

    if (editingServiceId) {
      setServices((current) =>
        current.map((item) => (item.id === data.id ? data : item))
      );
      setMsg("Hizmet güncellendi");
    } else {
      setServices((current) => [data, ...current]);
      setMsg("Hizmet eklendi");
    }
    setEditingServiceId(null);
    setServiceForm({
      title: "",
      kind: "TRANSFER",
      city: "",
      description: "",
      price: "",
    });
  }

  function editService(item: any) {
    setEditingServiceId(item.id);
    setServiceForm({
      title: item.title,
      kind: item.kind,
      city: item.city || "",
      description: item.description || "",
      price: item.price?.toString() || "",
    });
    window.scrollTo({ top: 500, behavior: "smooth" });
  }

  async function toggleService(service: any) {
    const response = await fetch(`/api/agencies/${agency.id}/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId: service.id,
        isActive: !service.isActive,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Hizmet durumu değişmedi");
      return;
    }
    setServices((current) =>
      current.map((item) => (item.id === data.id ? data : item))
    );
    setMsg(data.isActive ? "Hizmet yayında" : "Hizmet yayından kaldırıldı");
  }

  async function handlePackageSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = { ...packageForm, packageId: editingPackageId };
    const response = await fetch(`/api/agencies/${agency.id}/packages`, {
      method: editingPackageId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Paket kaydedilemedi");
      return;
    }

    if (editingPackageId) {
      setPackages((current) =>
        current.map((item) => (item.id === data.id ? data : item))
      );
      setMsg("Paket güncellendi");
    } else {
      setPackages((current) => [data, ...current]);
      setMsg("Paket eklendi");
    }
    setEditingPackageId(null);
    setPackageForm({
      title: "",
      category: "",
      city: "",
      providerName: "",
      description: "",
      languages: "",
      includes: "",
      startingPrice: "",
      currency: "EUR",
      transferIncluded: false,
      accommodationIncluded: false,
      airportPickup: false,
      coordinatorSupport: false,
    });
  }

  function editPackage(item: any) {
    setEditingPackageId(item.id);
    setPackageForm({
      title: item.title,
      category: item.category,
      city: item.city,
      providerName: item.providerName,
      description: item.description || "",
      languages: (item.languages || []).join(", "),
      includes: (item.includes || []).join(", "),
      startingPrice: item.startingPrice?.toString() || "",
      currency: item.currency || "EUR",
      transferIncluded: !!item.transferIncluded,
      accommodationIncluded: !!item.accommodationIncluded,
      airportPickup: !!item.airportPickup,
      coordinatorSupport: !!item.coordinatorSupport,
    });
    window.scrollTo({ top: 800, behavior: "smooth" });
  }

  async function togglePackage(item: any) {
    const response = await fetch(`/api/agencies/${agency.id}/packages`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        packageId: item.id,
        isPublished: !item.isPublished,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMsg(data.error || "Paket durumu değişmedi");
      return;
    }
    setPackages((current) =>
      current.map((row) => (row.id === data.id ? data : row))
    );
    setMsg(data.isPublished ? "Paket yayında" : "Paket yayından kaldırıldı");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {!canPublish && (
        <div
          style={{
            background: "#fffbeb",
            padding: "16px 20px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            border: "1px solid #fde68a",
            marginBottom: "24px",
          }}
        >
          <Info size={24} weight="duotone" color="#d97706" />
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#b45309",
              fontWeight: 500,
            }}
          >
            Profil doğrulanmadan hizmetler ve paketler hasta sayfasında
            görünmez. Zorunlu belgeler onaylı ve süresi geçerli olmalıdır.
          </p>
        </div>
      )}

      {msg && (
        <div className="form-success" style={{ marginBottom: "24px" }}>
          {msg}
        </div>
      )}

      {/* Genel Bilgiler */}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#f0fdf4", color: "#16a34a" }}
            >
              <Globe size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">Genel Bilgiler</h3>
              <p className="premium-accordion-desc">
                Acente profilinizi ve iletişim bilgilerinizi düzenleyin.
              </p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form className="responsive-form-grid" onSubmit={saveGenelBilgiler}>
            <div className="responsive-form-field">
              <label>Acente Adı</label>
              <input name="name" defaultValue={agency.name} required />
            </div>
            <div className="responsive-form-field">
              <label>Telefon</label>
              <input
                name="phone"
                defaultValue={agency.phone || ""}
                type="tel"
              />
            </div>
            <div className="responsive-form-field">
              <label>Web Sitesi</label>
              <input
                name="website"
                defaultValue={agency.website || ""}
                type="url"
              />
            </div>
            <div className="responsive-form-field">
              <label>İl</label>
              <input name="city" defaultValue={agency.city || ""} required />
            </div>

            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Açık Adres</label>
              <input
                name="address"
                defaultValue={agency.address || ""}
                required
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Hakkında (Açıklama)</label>
              <textarea
                name="description"
                defaultValue={agency.description || ""}
                rows={4}
                placeholder="Acentenizi ve vizyonunuzu tanıtın..."
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button className="primary" type="submit">
                Bilgileri Güncelle
              </button>
            </div>
          </form>
        </div>
      </details>

      <VerificationDocumentManager
        owner={{ kind: "agency", agencyId: agency.id }}
        documents={agency.verificationDocuments || []}
      />

      {/* Destek Hizmetleri */}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#fef2f2", color: "#ef4444" }}
            >
              <Handshake size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">Destek Hizmetleri</h3>
              <p className="premium-accordion-desc">
                Transfer, konaklama, tercüman gibi bağımsız hizmetler ekleyin.
              </p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form
            className="responsive-form-grid"
            onSubmit={handleServiceSubmit}
            style={{
              background: "#f8fafc",
              padding: "24px",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
              marginBottom: "24px",
            }}
          >
            <div className="responsive-form-field">
              <label>Hizmet Türü</label>
              <select
                value={serviceForm.kind}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, kind: e.target.value })
                }
              >
                {serviceKinds.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="responsive-form-field">
              <label>Hizmet Başlığı</label>
              <input
                value={serviceForm.title}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, title: e.target.value })
                }
                placeholder="Örn: VIP Havalimanı Transferi"
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>Şehir</label>
              <input
                value={serviceForm.city}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, city: e.target.value })
                }
                placeholder="Örn: İstanbul"
              />
            </div>
            <div className="responsive-form-field">
              <label>Fiyat (Opsiyonel)</label>
              <input
                value={serviceForm.price}
                onChange={(e) =>
                  setServiceForm({ ...serviceForm, price: e.target.value })
                }
                type="number"
                min="0"
                placeholder="₺"
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Kısa Açıklama</label>
              <input
                value={serviceForm.description}
                onChange={(e) =>
                  setServiceForm({
                    ...serviceForm,
                    description: e.target.value,
                  })
                }
                placeholder="Hizmet detayları..."
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              {editingServiceId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingServiceId(null);
                    setServiceForm({
                      title: "",
                      kind: "TRANSFER",
                      city: "",
                      description: "",
                      price: "",
                    });
                  }}
                >
                  İptal
                </button>
              )}
              <button className="primary" type="submit">
                {editingServiceId ? "Hizmeti Güncelle" : "Hizmet Ekle"}
              </button>
            </div>
          </form>

          <div
            style={{
              display: "grid",
              gap: "16px",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            }}
          >
            {services.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "20px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  background: s.isActive ? "#fff" : "#f8fafc",
                  opacity: s.isActive ? 1 : 0.7,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <strong
                      style={{
                        display: "block",
                        color: "#0f172a",
                        fontSize: "16px",
                      }}
                    >
                      {s.title}
                    </strong>
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "13px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <MapPin size={14} /> {s.city || "Genel"}
                    </span>
                  </div>
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: "100px",
                      fontSize: "11px",
                      fontWeight: 700,
                      background: s.isActive ? "#ecfdf5" : "#f1f5f9",
                      color: s.isActive ? "#10b981" : "#64748b",
                    }}
                  >
                    {s.isActive ? "Yayında" : "Pasif"}
                  </span>
                </div>
                {s.description && (
                  <p
                    style={{
                      fontSize: "13px",
                      color: "#475569",
                      margin: "0 0 12px 0",
                    }}
                  >
                    {s.description}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "16px",
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "12px",
                  }}
                >
                  <strong style={{ color: "#0284c7" }}>
                    {s.price ? s.price + " ₺" : "Fiyat Sorunuz"}
                  </strong>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => toggleService(s)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#64748b",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                        padding: "4px 8px",
                      }}
                    >
                      {s.isActive ? "Gizle" : "Yayınla"}
                    </button>
                    <button
                      type="button"
                      onClick={() => editService(s)}
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#475569",
                        cursor: "pointer",
                      }}
                    >
                      <PencilSimple weight="bold" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!services.length && (
              <div
                style={{
                  gridColumn: "1 / -1",
                  padding: "32px",
                  textAlign: "center",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: "16px",
                }}
              >
                Eklenmiş destek hizmeti yok.
              </div>
            )}
          </div>
        </div>
      </details>

      {/* Tedavi ve Seyahat Paketleri */}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#f3e8ff", color: "#9333ea" }}
            >
              <AirplaneTilt size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">
                Tedavi ve Seyahat Paketleri
              </h3>
              <p className="premium-accordion-desc">
                Sağlık turizmi hastalarına sunduğunuz kapsamlı paketleri
                yönetin.
              </p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form
            className="responsive-form-grid"
            onSubmit={handlePackageSubmit}
            style={{
              background: "#f8fafc",
              padding: "24px",
              borderRadius: "20px",
              border: "1px dashed #cbd5e1",
              marginBottom: "24px",
            }}
          >
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Paket Adı</label>
              <input
                value={packageForm.title}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, title: e.target.value })
                }
                placeholder="Örn: Saç Ekimi ve Konaklama Paketi"
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>Kategori</label>
              <input
                value={packageForm.category}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, category: e.target.value })
                }
                placeholder="Örn: Estetik"
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>Şehir</label>
              <input
                value={packageForm.city}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, city: e.target.value })
                }
                placeholder="Örn: İstanbul"
                required
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Sağlık Kurumu / Sağlayıcı</label>
              <input
                value={packageForm.providerName}
                onChange={(e) =>
                  setPackageForm({
                    ...packageForm,
                    providerName: e.target.value,
                  })
                }
                placeholder="Anlaşmalı hastane veya klinik adı"
                required
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Paket Açıklaması</label>
              <textarea
                value={packageForm.description}
                onChange={(e) =>
                  setPackageForm({
                    ...packageForm,
                    description: e.target.value,
                  })
                }
                rows={4}
                placeholder="Paketin kapsamını detaylıca anlatın..."
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>Diller (Virgülle ayırın)</label>
              <input
                value={packageForm.languages}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, languages: e.target.value })
                }
                placeholder="Türkçe, English, Arabic"
              />
            </div>
            <div className="responsive-form-field">
              <label>Dahil Olanlar (Virgülle ayırın)</label>
              <input
                value={packageForm.includes}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, includes: e.target.value })
                }
                placeholder="Muayene, 3 Gece Otel, VIP Transfer"
              />
            </div>
            <div className="responsive-form-field">
              <label>Başlangıç Fiyatı</label>
              <input
                value={packageForm.startingPrice}
                onChange={(e) =>
                  setPackageForm({
                    ...packageForm,
                    startingPrice: e.target.value,
                  })
                }
                type="number"
                min="0"
                placeholder="Fiyat"
              />
            </div>
            <div className="responsive-form-field">
              <label>Para Birimi</label>
              <select
                value={packageForm.currency}
                onChange={(e) =>
                  setPackageForm({ ...packageForm, currency: e.target.value })
                }
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="TRY">TRY</option>
              </select>
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label style={{ marginBottom: "12px" }}>Ekstra İmkanlar</label>
              <div
                style={{
                  display: "flex",
                  gap: "24px",
                  flexWrap: "wrap",
                  background: "#fff",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={packageForm.transferIncluded}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        transferIncluded: e.target.checked,
                      })
                    }
                    style={{ width: "20px", height: "20px" }}
                  />{" "}
                  Şehir İçi Transfer
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={packageForm.accommodationIncluded}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        accommodationIncluded: e.target.checked,
                      })
                    }
                    style={{ width: "20px", height: "20px" }}
                  />{" "}
                  Konaklama (Otel)
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={packageForm.airportPickup}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        airportPickup: e.target.checked,
                      })
                    }
                    style={{ width: "20px", height: "20px" }}
                  />{" "}
                  Havalimanı Karşılama
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={packageForm.coordinatorSupport}
                    onChange={(e) =>
                      setPackageForm({
                        ...packageForm,
                        coordinatorSupport: e.target.checked,
                      })
                    }
                    style={{ width: "20px", height: "20px" }}
                  />{" "}
                  7/24 Koordinatör
                </label>
              </div>
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
                marginTop: "8px",
              }}
            >
              {editingPackageId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingPackageId(null);
                    setPackageForm({
                      title: "",
                      category: "",
                      city: "",
                      providerName: "",
                      description: "",
                      languages: "",
                      includes: "",
                      startingPrice: "",
                      currency: "EUR",
                      transferIncluded: false,
                      accommodationIncluded: false,
                      airportPickup: false,
                      coordinatorSupport: false,
                    });
                  }}
                >
                  İptal
                </button>
              )}
              <button className="primary" type="submit">
                {editingPackageId ? "Paketi Güncelle" : "Paket Ekle"}
              </button>
            </div>
          </form>

          <div
            style={{ display: "grid", gap: "16px", gridTemplateColumns: "1fr" }}
          >
            {packages.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "24px",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  background: p.isPublished ? "#fff" : "#f8fafc",
                  opacity: p.isPublished ? 1 : 0.7,
                  display: "flex",
                  gap: "24px",
                  flexWrap: "wrap",
                  alignItems: "flex-start",
                }}
              >
                <div style={{ flex: 1, minWidth: "280px" }}>
                  <div
                    style={{ display: "flex", gap: "8px", marginBottom: "8px" }}
                  >
                    <span
                      style={{
                        background: "#f1f5f9",
                        color: "#475569",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {p.category}
                    </span>
                    <span
                      style={{
                        background: p.isPublished ? "#ecfdf5" : "#f1f5f9",
                        color: p.isPublished ? "#10b981" : "#64748b",
                        padding: "4px 10px",
                        borderRadius: "100px",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {p.isPublished ? "Yayında" : "Taslak"}
                    </span>
                  </div>
                  <h4
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "18px",
                      color: "#0f172a",
                    }}
                  >
                    {p.title}
                  </h4>
                  <p
                    style={{
                      margin: "0 0 12px 0",
                      color: "#64748b",
                      fontSize: "14px",
                    }}
                  >
                    {p.providerName} <span style={{ color: "#cbd5e1" }}>•</span>{" "}
                    {p.city}
                  </p>

                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      flexWrap: "wrap",
                      marginTop: "12px",
                    }}
                  >
                    {p.transferIncluded && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Transfer
                      </span>
                    )}
                    {p.accommodationIncluded && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Konaklama
                      </span>
                    )}
                    {p.airportPickup && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Havalimanı
                      </span>
                    )}
                    {p.coordinatorSupport && (
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          padding: "4px 10px",
                          borderRadius: "8px",
                          background: "#f8fafc",
                          color: "#475569",
                          fontSize: "12px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Koordinatör
                      </span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    minWidth: "140px",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        color: "#94a3b8",
                        fontSize: "12px",
                      }}
                    >
                      Başlangıç Fiyatı
                    </span>
                    <strong style={{ color: "#0284c7", fontSize: "20px" }}>
                      {p.startingPrice
                        ? p.startingPrice + " " + p.currency
                        : "Fiyat Sorunuz"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => togglePackage(p)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "100px",
                        background: "#f1f5f9",
                        border: "none",
                        color: "#475569",
                        fontWeight: 600,
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      {p.isPublished ? "Gizle" : "Yayınla"}
                    </button>
                    <button
                      type="button"
                      onClick={() => editPackage(p)}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "100px",
                        background: "#0f172a",
                        border: "none",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        cursor: "pointer",
                      }}
                    >
                      <PencilSimple weight="bold" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {!packages.length && (
              <div
                style={{
                  padding: "32px",
                  textAlign: "center",
                  color: "#94a3b8",
                  background: "#f8fafc",
                  borderRadius: "16px",
                }}
              >
                Eklenmiş paket yok.
              </div>
            )}
          </div>
        </div>
      </details>
    </div>
  );
}
