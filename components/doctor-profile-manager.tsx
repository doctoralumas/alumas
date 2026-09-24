"use client";

import { useState } from "react";
import { Info, CaretDown } from "@phosphor-icons/react/dist/ssr";

export default function DoctorProfileManager({ profile }: { profile: any }) {
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get("name"),
      title: f.get("title"),
      specialty: f.get("specialty"),
      hospital: f.get("hospital"),
      city: f.get("city"),
      bio: f.get("bio"),
      price: f.get("price"),
    };
    const r = await fetch("/api/doctors/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      setMsg("Profil bilgileri g\u00fcncellendi");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      setMsg("Bilgiler g\u00fcncellenemedi");
    }
  }

  return (
    <>
      {msg && (
        <div className="form-success" style={{ marginBottom: "24px" }}>
          {msg}
        </div>
      )}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#f3f4f6", color: "#4b5563" }}
            >
              <Info size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">Profil Bilgileri</h3>
              <p className="premium-accordion-desc">
                Uzman profilinizi, \u00fcnvan\u0131n\u0131z\u0131 ve
                hakk\u0131nda bilginizi d\u00fczenleyin.
              </p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form className="responsive-form-grid" onSubmit={handleSubmit}>
            <div className="responsive-form-field">
              <label>Ad Soyad</label>
              <input name="name" defaultValue={profile.name} required />
            </div>
            <div className="responsive-form-field">
              <label>\u00dcnvan (Örn: Prof. Dr.)</label>
              <input name="title" defaultValue={profile.title} required />
            </div>
            <div className="responsive-form-field">
              <label>Uzmanl\u0131k Alan\u0131</label>
              <input
                name="specialty"
                defaultValue={profile.specialty}
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>
                \u00c7al\u0131\u015ft\u0131\u011f\u0131 Kurum / Hastane
              </label>
              <input name="hospital" defaultValue={profile.hospital} required />
            </div>
            <div className="responsive-form-field">
              <label>\u015eehir</label>
              <input name="city" defaultValue={profile.city} required />
            </div>
            <div className="responsive-form-field">
              <label>Muayene \u00dccreti (TL)</label>
              <input
                name="price"
                defaultValue={profile.price}
                type="number"
                required
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Hakk\u0131nda (Bio)</label>
              <textarea
                name="bio"
                defaultValue={profile.bio || ""}
                rows={4}
                placeholder="E\u011fitim ge\u00e7mi\u015finiz, ilgi alanlar\u0131n\u0131z..."
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
                Bilgileri G\u00fcncelle
              </button>
            </div>
          </form>
        </div>
      </details>
    </>
  );
}
