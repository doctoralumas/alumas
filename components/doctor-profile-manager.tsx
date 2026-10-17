"use client";

import { useState } from "react";
import { Info, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { useTranslations } from "next-intl";

export default function DoctorProfileManager({ profile }: { profile: any }) {
  const t = useTranslations("professional.doctorProfileManager");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: any) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const payload = {
      name: f.get('name'),
      title: f.get('title'),
      specialty: f.get('specialty'),
      hospital: f.get('hospital'),
      city: f.get('city'),
      bio: f.get('bio'),
      price: f.get('price'),
    };
    const r = await fetch('/api/doctors/profile', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (r.ok) {
       setMsg(t("success"));
       setTimeout(() => window.location.reload(), 1000);
    } else {
       setMsg(t("failed"));
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
            <div className="premium-accordion-icon" style={{ background: '#f3f4f6', color: '#4b5563' }}>
              <Info size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">{t("title")}</h3>
              <p className="premium-accordion-desc">{t("desc")}</p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form className="responsive-form-grid" onSubmit={handleSubmit}>
            <div className="responsive-form-field">
              <label>{t("fullName")}</label>
              <input name="name" defaultValue={profile.name} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("titleLabel")}</label>
              <input name="title" defaultValue={profile.title} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("specialty")}</label>
              <input name="specialty" defaultValue={profile.specialty} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("hospital")}</label>
              <input name="hospital" defaultValue={profile.hospital} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("city")}</label>
              <input name="city" defaultValue={profile.city} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("price")}</label>
              <input name="price" defaultValue={profile.price} type="number" required />
            </div>
            <div className="responsive-form-field" style={{ gridColumn: '1 / -1' }}>
              <label>{t("bio")}</label>
              <textarea name="bio" defaultValue={profile.bio || ''} rows={4} placeholder={t("bioPlaceholder")} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="primary" type="submit">{t("updateBtn")}</button>
            </div>
          </form>
        </div>
      </details>
    </>
  );
}
