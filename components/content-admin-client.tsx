"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function ContentAdminClient() {
  const t = useTranslations("admin.contentAdmin");
  const [d, setD] = useState<any>({ banners: [], categories: [], inquiries: [] });
  const [msg, setMsg] = useState("");

  const load = () =>
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then(setD);

  useEffect(() => {
    load();
  }, []);

  async function create(e: any, kind: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, ...Object.fromEntries(f) }),
    });
    setMsg(r.ok ? t("saveSuccess") : t("saveFailed"));
    if (r.ok) {
      form.reset();
      load();
    }
  }

  async function toggle(kind: string, id: string, isActive: boolean) {
    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, id, isActive }),
    });
    load();
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {msg && <div className="inline-message form-span">{msg}</div>}
      <section className="panel">
        <h2>{t("bannerSectionTitle")}</h2>
        <form className="business-form" onSubmit={(e) => create(e, "banner")}>
          <div className="form-pair">
            <input name="title" placeholder={t("titlePlaceholder")} required />
            <input name="subtitle" placeholder={t("subtitlePlaceholder")} />
          </div>
          <div className="form-pair">
            <input name="ctaLabel" placeholder={t("ctaLabelPlaceholder")} />
            <input name="ctaHref" placeholder={t("ctaHrefPlaceholder")} />
          </div>
          <div className="form-pair">
            <input name="background" placeholder={t("bgPlaceholder")} />
            <input name="sortOrder" type="number" defaultValue="0" />
          </div>
          <button className="primary">{t("addBanner")}</button>
        </form>
        <div className="slot-list">
          {d.banners.map((x: any) => (
            <div className="slot-row" key={x.id}>
              <div>
                <b>{x.title}</b>
                <span>{x.subtitle || ""}</span>
              </div>
              <button className="secondary" onClick={() => toggle("banner", x.id, !x.isActive)}>
                {x.isActive ? t("deactivate") : t("activate")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t("categorySectionTitle")}</h2>
        <form className="business-form" onSubmit={(e) => create(e, "category")}>
          <div className="form-pair">
            <input name="name" placeholder={t("categoryNamePlaceholder")} required />
            <input name="slug" placeholder={t("slugPlaceholder")} />
          </div>
          <div className="form-pair">
            <select name="categoryKind">
              <option value="service">{t("kindService")}</option>
              <option value="content">{t("kindContent")}</option>
              <option value="tourism">{t("kindTourism")}</option>
            </select>
            <input name="templateKey" placeholder={t("templatePlaceholder")} defaultValue="default" />
          </div>
          <input name="description" placeholder={t("descPlaceholder")} />
          <button className="primary">{t("addCategory")}</button>
        </form>
        <div className="slot-list">
          {d.categories.map((x: any) => (
            <div className="slot-row" key={x.id}>
              <div>
                <b>{x.name}</b>
                <span>
                  {x.kind} · {x.templateKey}
                </span>
              </div>
              <button className="secondary" onClick={() => toggle("category", x.id, !x.isActive)}>
                {x.isActive ? t("deactivate") : t("activate")}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>{t("inquiriesSectionTitle")}</h2>
        <div className="slot-list">
          {d.inquiries.map((x: any) => (
            <div className="slot-row" key={x.id}>
              <div>
                <b>{x.subject}</b>
                <span>
                  {x.name} · {x.email} · {x.message}
                </span>
              </div>
              <span className="status">{x.status}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}