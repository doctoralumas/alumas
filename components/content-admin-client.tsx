"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import AdminConfirmDialog from "@/components/admin/admin-confirm-dialog";
import AdminStatusBadge from "@/components/admin/admin-status-badge";
import AdminCallout from "@/components/admin/admin-callout";

export default function ContentAdminClient() {
  const t = useTranslations("admin.contentAdmin");
  const [d, setD] = useState<any>({ banners: [], categories: [], inquiries: [] });
  const [msg, setMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [confirmDialog, setConfirmDialog] = useState<{
    kind: "banner" | "category";
    id: string;
    title: string;
    description: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () =>
    fetch("/api/admin/content")
      .then((r) => r.json())
      .then(setD);

  useEffect(() => {
    load();
  }, []);

  async function create(e: any, kind: string) {
    e.preventDefault();
    setMsg("");
    setErrorMsg("");
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind, ...Object.fromEntries(f) }),
    });
    if (r.ok) {
      setMsg(t("saveSuccess"));
      form.reset();
      load();
      setTimeout(() => setMsg(""), 4000);
    } else {
      const err = await r.json().catch(() => ({}));
      setErrorMsg(err.error || t("saveFailed"));
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

  function handleDeleteClick(kind: "banner" | "category", id: string, name: string) {
    setConfirmDialog({
      kind,
      id,
      title: kind === "banner" ? "Bannerı Sil" : "Kategoriyi Sil",
      description: `"${name}" öğesini kalıcı olarak silmek istediğinizden emin misiniz?`,
    });
  }

  async function executeDelete() {
    if (!confirmDialog) return;
    setIsDeleting(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/content?kind=${confirmDialog.kind}&id=${confirmDialog.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Silme işlemi başarısız.");
      }
      setMsg("Öğe başarıyla silindi.");
      setConfirmDialog(null);
      load();
      setTimeout(() => setMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Silme işlemi başarısız.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Callouts */}
      {msg && <AdminCallout variant="success">{msg}</AdminCallout>}
      {errorMsg && <AdminCallout variant="danger">{errorMsg}</AdminCallout>}

      {/* Link to Dedicated Inquiries */}
      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e3a8a" }}>
            💬 İletişim ve Destek Talepleri Modülü
          </div>
          <div style={{ fontSize: "13px", color: "#3b82f6", marginTop: "2px" }}>
            Platforma gelen kullanıcı talepleri, durum yönetimi ve çözümleme için özel operasyon ekranı mevcuttur.
          </div>
        </div>
        <Link
          href="/admin/inquiries"
          style={{
            padding: "8px 16px",
            background: "#2563eb",
            color: "#ffffff",
            borderRadius: "8px",
            fontSize: "13px",
            fontWeight: 600,
            textDecoration: "none",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          Talepleri Yönet →
        </Link>
      </div>

      {/* BANNER SECTION */}
      <section className="panel" style={{ background: "var(--bg, #ffffff)", borderRadius: "12px", padding: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>{t("bannerSectionTitle")}</h2>
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
          <button className="primary" style={{ cursor: "pointer" }}>{t("addBanner")}</button>
        </form>

        <div className="slot-list" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {d.banners.map((x: any) => (
            <div
              className="slot-row"
              key={x.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "8px",
                background: "#f8fafc",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <b style={{ fontSize: "14px", color: "#1e293b" }}>{x.title}</b>
                  <AdminStatusBadge
                    status={x.isActive ? "ACTIVE" : "INACTIVE"}
                    label={x.isActive ? "Aktif" : "Pasif"}
                    size="sm"
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  {x.subtitle || "Alt metin yok"} · Buton: {x.ctaLabel || "-"} ({x.ctaHref || "-"}) · Sıra: {x.sortOrder}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="secondary"
                  onClick={() => toggle("banner", x.id, !x.isActive)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {x.isActive ? t("deactivate") : t("activate")}
                </button>
                <button
                  onClick={() => handleDeleteClick("banner", x.id, x.title)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="panel" style={{ background: "var(--bg, #ffffff)", borderRadius: "12px", padding: "20px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>{t("categorySectionTitle")}</h2>
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
          <button className="primary" style={{ cursor: "pointer" }}>{t("addCategory")}</button>
        </form>

        <div className="slot-list" style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
          {d.categories.map((x: any) => (
            <div
              className="slot-row"
              key={x.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 14px",
                border: "1px solid var(--border-light, #e2e8f0)",
                borderRadius: "8px",
                background: "#f8fafc",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <b style={{ fontSize: "14px", color: "#1e293b" }}>{x.name}</b>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>({x.slug})</span>
                  <AdminStatusBadge
                    status={x.isActive ? "ACTIVE" : "INACTIVE"}
                    label={x.isActive ? "Aktif" : "Pasif"}
                    size="sm"
                  />
                </div>
                <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                  Tür: {x.kind} · Şablon: {x.templateKey} {x.description ? `· ${x.description}` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="secondary"
                  onClick={() => toggle("category", x.id, !x.isActive)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {x.isActive ? t("deactivate") : t("activate")}
                </button>
                <button
                  onClick={() => handleDeleteClick("category", x.id, x.name)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #fecaca",
                    background: "#fef2f2",
                    color: "#dc2626",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Sil
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CONFIRM DELETE DIALOG */}
      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel="Evet, Sil"
          cancelLabel="Vazgeç"
          variant="danger"
          isBusy={isDeleting}
          onConfirm={executeDelete}
          onClose={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}
