"use client";

import { useCallback, useEffect, useState } from "react";

export default function ProviderAgreementManager({
  organizationId,
  initialInsurers = [],
}: {
  organizationId: string;
  initialInsurers?: any[];
}) {
  const [insurers, setInsurers] = useState<any[]>(initialInsurers);
  const [agreements, setAgreements] = useState<any[]>([]);
  const [legacyContracts, setLegacyContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const [providerId, setProviderId] = useState("");
  const [productType, setProductType] = useState("TSS");
  const [networkId, setNetworkId] = useState("");
  const [coverageScope, setCoverageScope] = useState("ALL_BRANCHES");
  const [excludedBranches, setExcludedBranches] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [note, setNote] = useState("");

  const loadAgreements = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/organizations/${organizationId}/insurance`, {
        cache: "no-store",
      });
      if (r.ok) {
        const json = await r.json();
        if (Array.isArray(json.insurers) && json.insurers.length > 0) {
          setInsurers(json.insurers);
        }
        setAgreements(Array.isArray(json.agreements) ? json.agreements : []);
        setLegacyContracts(Array.isArray(json.legacyContracts) ? json.legacyContracts : []);
      }
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void loadAgreements();
  }, [loadAgreements]);

  const selectedInsurer = insurers.find((i) => i.id === providerId) || null;
  const availableNetworks: any[] = selectedInsurer?.networks || [];

  async function handleDeclare(e: React.FormEvent) {
    e.preventDefault();
    if (!providerId) return;
    setBusy(true);
    setFeedback(null);
    try {
      const specialtyRules = excludedBranches
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((code) => ({
          specialtyCode: code.toUpperCase(),
          ruleKind: "EXCLUDED",
        }));

      const r = await fetch(`/api/organizations/${organizationId}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          insuranceProviderId: providerId,
          productType: productType || null,
          networkId: networkId || null,
          coverageScope,
          specialtyRules,
          expiresAt: expiresAt || null,
          note: note || null,
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFeedback({
          type: "err",
          text: json.message || json.error || "Anlaşma beyanı kaydedilemedi.",
        });
        return;
      }
      setFeedback({
        type: "ok",
        text: "Sigorta anlaşma beyanı kaydedildi (Durum: Kurum Beyanı — Sigorta Şirketi / Yönetici Teyidi Bekliyor).",
      });
      setNote("");
      setExcludedBranches("");
      await loadAgreements();
    } finally {
      setBusy(false);
    }
  }

  async function handlePatchAgreement(
    agreementId: string,
    action: "CONFIRM_AGREEMENT" | "DISPUTE_AGREEMENT" | "EXPIRE_AGREEMENT",
    reason?: string
  ) {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await fetch(`/api/organizations/${organizationId}/insurance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreementId, action, reason }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFeedback({
          type: "err",
          text: json.message || json.error || "Anlaşma durumu güncellenemedi.",
        });
        return;
      }
      setFeedback({
        type: "ok",
        text:
          action === "CONFIRM_AGREEMENT"
            ? "Sigorta şirketi anlaşması kurumunuz tarafından onaylandı (Karşılıklı Teyitli)."
            : "Anlaşma durumu güncellendi.",
      });
      await loadAgreements();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteAgreement(agreementId: string) {
    setBusy(true);
    setFeedback(null);
    try {
      const r = await fetch(
        `/api/organizations/${organizationId}/insurance?agreementId=${encodeURIComponent(agreementId)}`,
        { method: "DELETE" }
      );
      const json = await r.json().catch(() => ({}));
      if (!r.ok) {
        setFeedback({
          type: "err",
          text: json.message || json.error || "Anlaşma silinemedi.",
        });
        return;
      }
      setFeedback({ type: "ok", text: "Kurum sigorta anlaşma beyanı kaldırıldı." });
      await loadAgreements();
    } finally {
      setBusy(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "13.5px",
    background: "#ffffff",
  };

  return (
    <div data-testid="provider-agreement-manager" style={{ display: "grid", gap: "18px" }}>
      {feedback && (
        <div
          data-testid="provider-agreement-feedback"
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            background: feedback.type === "ok" ? "#dcfce7" : "#fee2e2",
            color: feedback.type === "ok" ? "#166534" : "#991b1b",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          {feedback.text}
        </div>
      )}

      <form
        data-testid="provider-declare-agreement-form"
        onSubmit={handleDeclare}
        style={{
          padding: "18px",
          borderRadius: "16px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          display: "grid",
          gap: "12px",
        }}
      >
        <div style={{ fontWeight: 800, fontSize: "14px", color: "#0f172a" }}>
          Yapılandırılmış Sigorta Anlaşması Beyan Et (Ürün, Ağ & Kapsam Bazlı)
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Sigorta Şirketi *
            </span>
            <select
              data-testid="provider-insurer-select"
              required
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setNetworkId("");
              }}
              style={inputStyle}
            >
              <option value="">Sigorta Şirketi Seçin...</option>
              {insurers.map((ins) => (
                <option key={ins.id} value={ins.id}>
                  {ins.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Sigorta Ürün Türü
            </span>
            <select
              data-testid="provider-product-type-select"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              style={inputStyle}
            >
              <option value="TSS">TSS — Tamamlayıcı Sağlık</option>
              <option value="OSS">ÖSS — Özel Sağlık</option>
              <option value="TRAVEL">TRAVEL — Seyahat Sağlık</option>
              <option value="FOREIGN_HEALTH">FOREIGN_HEALTH — Yabancı Sağlık</option>
            </select>
          </label>

          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Anlaşmalı Ağ (Network)
            </span>
            <select
              data-testid="provider-network-select"
              value={networkId}
              onChange={(e) => setNetworkId(e.target.value)}
              style={inputStyle}
            >
              <option value="">Tüm Ağlar / Genel</option>
              {availableNetworks.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Hizmet Kapsamı
            </span>
            <select
              data-testid="provider-coverage-scope-select"
              value={coverageScope}
              onChange={(e) => setCoverageScope(e.target.value)}
              style={inputStyle}
            >
              <option value="ALL_BRANCHES">Tam Kapsam (Yatarak + Ayakta)</option>
              <option value="INPATIENT_ONLY">Sadece Yatarak Tedavi</option>
              <option value="OUTPATIENT_ONLY">Sadece Ayakta Tedavi</option>
              <option value="EMERGENCY_ONLY">Sadece Acil Hizmetler</option>
              <option value="PARTIAL_BRANCH_BASED">Branş Bazlı Kısmi Anlaşma</option>
            </select>
          </label>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Kapsam Dışı Branş Kodları (Opsiyonel)
            </span>
            <input
              placeholder="Örn: DIS, ESTETIK"
              value={excludedBranches}
              onChange={(e) => setExcludedBranches(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Sözleşme Bitiş Tarihi (Opsiyonel)
            </span>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#334155" }}>
              Provizyon / Katılım Payı Notu
            </span>
            <input
              data-testid="provider-agreement-note-input"
              placeholder="Örn: Tüm polikliniklerde geçerli"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#64748b" }}>
            Not: Kurum beyanları hasta keşif ekranlarında <strong>&quot;Kurum Beyanı (Teyit Bekliyor)&quot;</strong> olarak gösterilir; sigorta şirketi veya yönetici onayladığında <strong>&quot;Teyitli Anlaşma&quot;</strong> statüsüne yükselir.
          </span>
          <button
            type="submit"
            data-testid="provider-declare-submit-btn"
            disabled={busy}
            style={{
              padding: "10px 18px",
              borderRadius: "10px",
              border: "none",
              background: "#0f766e",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "13px",
              cursor: "pointer",
            }}
          >
            Anlaşma Beyanını Kaydet
          </button>
        </div>
      </form>

      {loading ? (
        <div style={{ fontSize: "13px", color: "#64748b" }}>Anlaşmalar yükleniyor...</div>
      ) : (
        <div style={{ display: "grid", gap: "10px" }}>
          {agreements.map((agr) => (
            <div
              key={agr.id}
              data-testid={`provider-agreement-item-${agr.id}`}
              style={{
                padding: "14px",
                borderRadius: "14px",
                background:
                  agr.verificationStatus === "INSURER_DECLARED" ? "#f0fdfa" : "#ffffff",
                border: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "15px", color: "#0f172a" }}>
                    {agr.insurerName || "Sigorta Şirketi"}
                  </strong>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "999px",
                      background:
                        agr.verificationStatus === "MUTUALLY_CONFIRMED" ||
                        agr.verificationStatus === "ADMIN_VERIFIED"
                          ? "#dcfce7"
                          : agr.verificationStatus === "INSURER_DECLARED"
                          ? "#ccfbf1"
                          : "#fef3c7",
                      color: "#0f172a",
                    }}
                  >
                    {agr.verificationStatus}
                  </span>
                </div>
                <div style={{ fontSize: "12.5px", color: "#475569", marginTop: "4px" }}>
                  Ürün: {agr.productType || "Tümü"} · Kapsam: {agr.coverageScope}
                  {agr.networkName ? ` · Ağ: ${agr.networkName}` : ""}
                </div>
                {agr.note && (
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                    {agr.note}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {agr.verificationStatus === "INSURER_DECLARED" && (
                  <button
                    type="button"
                    data-testid={`provider-confirm-insurer-agreement-${agr.id}`}
                    disabled={busy}
                    onClick={() =>
                      void handlePatchAgreement(agr.id, "CONFIRM_AGREEMENT")
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#059669",
                      color: "#ffffff",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✓ Sigorta Beyanını Onayla (Karşılıklı Teyit)
                  </button>
                )}

                {agr.verificationStatus !== "DISPUTED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void handlePatchAgreement(
                        agr.id,
                        "DISPUTE_AGREEMENT",
                        "Kurum sözleşme kayıtlarıyla uyuşmuyor."
                      )
                    }
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#b91c1c",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Uyuşmazlık Bildir
                  </button>
                )}

                {(agr.verificationStatus === "PROVIDER_DECLARED" ||
                  agr.verificationStatus === "UNVERIFIED") && (
                  <button
                    type="button"
                    data-testid={`provider-delete-agreement-${agr.id}`}
                    disabled={busy}
                    onClick={() => void handleDeleteAgreement(agr.id)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      background: "#ffffff",
                      color: "#475569",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Beyanı Kaldır
                  </button>
                )}
              </div>
            </div>
          ))}

          {legacyContracts.length > 0 && agreements.length === 0 && (
            <div style={{ fontSize: "12.5px", color: "#64748b" }}>
              Mevcut Kurum Beyanlı Kayıtlar: {legacyContracts.length} adet
            </div>
          )}
        </div>
      )}
    </div>
  );
}

