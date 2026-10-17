"use client";

import SectionVisual from "@/components/section-visual";
import { useEffect, useState } from "react";
import {
  Stethoscope,
  Syringe,
  Drop,
  FirstAid,
  Wheelchair,
  MapPin,
  CalendarBlank,
  CaretRight,
  Info,
  CheckCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { HOME_CARE_KINDS } from "@/lib/home-care";
import ClientLockOverlay from "@/components/client-lock-overlay";
import { useLocale, useTranslations } from "next-intl";

const icons = {
  doctor: Stethoscope,
  nurse: Syringe,
  blood: Drop,
  dressing: FirstAid,
  physio: Wheelchair,
};

type Offer = {
  id: string;
  providerName: string;
  detail: string;
  city: string;
  price?: number | null;
  prior?: boolean;
  slots?: { startsAt: string }[];
  organizationId?: string;
  serviceId?: string;
  laboratoryTestId?: string;
};

type Visit = {
  id: string;
  title: string;
  detail?: string | null;
  providerName?: string | null;
  city: string;
  district?: string | null;
  preferredAt?: string | null;
  statusLabel: string;
  status: string;
  legacy?: boolean;
};

type HomeAppointment = {
  id: string;
  doctorName: string;
  specialty: string;
  startsAt: string;
  status: string;
  visitCity?: string | null;
  visitDistrict?: string | null;
  visitAddress?: string | null;
};

export default function HomeCareClient({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("health.homeCare");
  const locale = useLocale();

  const [kind, setKind] = useState<(typeof HOME_CARE_KINDS)[number]["id"]>("doctor");
  const [city, setCity] = useState("");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [slot, setSlot] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [legacy, setLegacy] = useState<Visit[]>([]);
  const [homeAppointments, setHomeAppointments] = useState<HomeAppointment[]>([]);
  const [msg, setMsg] = useState("");
  const [actionStatus, setActionStatus] = useState<"idle" | "success" | "error">("idle");
  const [submitting, setSubmitting] = useState(false);
  const selected = offers.find((offer) => offer.id === selectedId);

  async function loadHistory() {
    const response = await fetch("/api/home-care");
    if (!response.ok) return;
    const data = await response.json();
    setVisits(Array.isArray(data.visits) ? data.visits : []);
    setLegacy(Array.isArray(data.legacy) ? data.legacy : []);
    setHomeAppointments(Array.isArray(data.homeAppointments) ? data.homeAppointments : []);
  }

  useEffect(() => {
    if (isLoggedIn) loadHistory();
  }, [isLoggedIn]);

  async function searchOffers(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMsg("");
    setSearched(false);
    setSelectedId("");
    setSlot("");
    const response = await fetch(
      `/api/home-care/offers?kind=${kind}&city=${encodeURIComponent(city.trim())}`
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setOffers([]);
      setMsg(data.error || t("errorSubmit"));
      return;
    }
    setOffers(Array.isArray(data.offers) ? data.offers : []);
    setSearched(true);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setMsg("");
    const form = event.currentTarget;
    const data = new FormData(form);
    const preferredAt = kind === "doctor" ? null : new Date(String(data.get("preferredAt") || ""));
    if (preferredAt && Number.isNaN(preferredAt.getTime())) {
      setMsg(t("errorTimeInvalid"));
      setSubmitting(false);
      return;
    }
    try {
      const response =
        kind === "doctor"
          ? await fetch("/api/appointments", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                doctorId: selected.id,
                startsAt: slot,
                type: "home",
                visitCity: selected.city,
                visitDistrict: data.get("district"),
                visitAddress: data.get("addressNote"),
                note: data.get("note") || null,
              }),
            })
          : await fetch("/api/home-care", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kind,
                city: selected.city,
                district: data.get("district"),
                addressNote: data.get("addressNote"),
                preferredAt: preferredAt?.toISOString(),
                note: data.get("note") || null,
                serviceId: selected.serviceId,
                laboratoryTestId: selected.laboratoryTestId,
              }),
            });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setActionStatus("error");
        setMsg(body.error || body.message || t("errorSubmit"));
        return;
      }
      setActionStatus("success");
      setMsg(kind === "doctor" ? t("successDoctor") : t("successOrg"));
      setSelectedId("");
      setSlot("");
      form.reset();
      loadHistory();
    } catch {
      setActionStatus("error");
      setMsg(t("errorConnection"));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelVisit(id: string) {
    const response = await fetch(`/api/home-care/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (response.ok) loadHistory();
    else {
      const body = await response.json().catch(() => ({}));
      setMsg(body.error || t("errorCancel"));
    }
  }

  const emptyCopy = kind === "doctor" ? t("emptyDoctor") : t("emptyOrg");

  function getLocalizedVisitStatus(status: string, isLegacyVisit: boolean): string {
    if (isLegacyVisit) return t("status.legacy");
    switch (status) {
      case "REQUESTED":
        return t("status.requested");
      case "ACCEPTED":
        return t("status.accepted");
      case "DECLINED":
        return t("status.declined");
      case "COMPLETED":
        return t("status.completed");
      case "CANCELLED":
        return t("status.cancelled");
      default:
        return t("status.legacy");
    }
  }

  function getLocalizedAppointmentStatus(status: string): string {
    switch (status) {
      case "confirmed":
        return t("status.confirmed");
      case "completed":
        return t("status.completed");
      case "cancelled":
        return t("status.cancelled");
      default:
        return status;
    }
  }

  function getLocalizedKindTitle(kindId: string): string {
    switch (kindId) {
      case "doctor":
        return t("kinds.doctor");
      case "nurse":
        return t("kinds.nurse");
      case "blood":
        return t("kinds.blood");
      case "dressing":
        return t("kinds.dressing");
      case "physio":
        return t("kinds.physio");
      default:
        return t("kinds.default");
    }
  }

  const dateLocale = locale === "en" ? "en-US" : "tr-TR";

  return (
    <div className="page" style={{ maxWidth: "1000px" }}>
      <SectionVisual slug="home-care" alt={t("title")} />
      <div style={{ marginBottom: "40px" }}>
        <span className="kicker" style={{ color: "#0284c7" }}>
          {t("kicker")}
        </span>
        <h1 style={{ fontSize: "32px", color: "#0f172a", margin: "8px 0" }}>{t("title")}</h1>
        <p style={{ color: "#64748b", margin: 0, fontSize: "16px", maxWidth: "640px" }}>
          {t("subtitle")}
        </p>
      </div>

      <section
        style={{
          background: "#fff",
          borderRadius: "32px",
          padding: "32px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)",
        }}
      >
        <ClientLockOverlay isLoggedIn={isLoggedIn}>
          <form
            onSubmit={searchOffers}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                  fontSize: "18px",
                }}
              >
                {t("serviceQuestion")}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {HOME_CARE_KINDS.map((service) => {
                  const Icon = icons[service.id];
                  const active = kind === service.id;
                  return (
                    <button
                      type="button"
                      key={service.id}
                      onClick={() => {
                        setKind(service.id);
                        setSearched(false);
                        setOffers([]);
                        setSelectedId("");
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "14px 20px",
                        borderRadius: "16px",
                        border: active ? "none" : "1px solid #cbd5e1",
                        background: active ? "#0f172a" : "#f8fafc",
                        color: active ? "#fff" : "#475569",
                        fontWeight: active ? 600 : 500,
                        cursor: "pointer",
                      }}
                    >
                      <Icon size={22} weight={active ? "duotone" : "regular"} />
                      {getLocalizedKindTitle(service.id)}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "end" }}>
              <div style={{ flex: 1, minWidth: "220px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#475569",
                    marginBottom: "8px",
                  }}
                >
                  {t("cityLabel")}
                </label>
                <input
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder={t("cityPlaceholder")}
                  required
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    borderRadius: "16px",
                    border: "1px solid #cbd5e1",
                    background: "#f8fafc",
                    outline: "none",
                    fontSize: "15px",
                  }}
                />
              </div>
              <button
                style={{
                  padding: "14px 22px",
                  background: "#0284c7",
                  color: "#fff",
                  borderRadius: "16px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {t("findProviders")}
              </button>
            </div>
          </form>

          {searched && !offers.length && (
            <div
              style={{
                marginTop: "20px",
                padding: "16px",
                borderRadius: "16px",
                background: "#f8fafc",
                color: "#475569",
              }}
            >
              {emptyCopy}
            </div>
          )}

          {!!offers.length && (
            <div
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              {offers.map((offer) => (
                <button
                  type="button"
                  key={offer.id}
                  onClick={() => {
                    setSelectedId(offer.id);
                    setSlot(offer.slots?.[0]?.startsAt || "");
                  }}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: "16px",
                    border: selectedId === offer.id ? "2px solid #0284c7" : "1px solid #e2e8f0",
                    background: selectedId === offer.id ? "#f0f9ff" : "#fff",
                    cursor: "pointer",
                  }}
                >
                  <strong style={{ display: "block", color: "#0f172a" }}>
                    {offer.providerName}
                  </strong>
                  <span style={{ color: "#64748b", fontSize: "14px" }}>
                    {offer.detail}
                    {offer.prior ? ` · ${t("previousDoctor")}` : ""}
                    {offer.price != null
                      ? ` · ${offer.price.toLocaleString(dateLocale)} ₺`
                      : ""}
                  </span>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <form
              onSubmit={submit}
              style={{
                marginTop: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {kind === "doctor" ? (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "8px",
                    }}
                  >
                    {t("slotLabel")}
                  </label>
                  <select
                    value={slot}
                    onChange={(event) => setSlot(event.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                    }}
                  >
                    {(selected.slots || []).map((item) => (
                      <option key={item.startsAt} value={item.startsAt}>
                        {new Date(item.startsAt).toLocaleString(dateLocale, {
                          day: "numeric",
                          month: "long",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#475569",
                      marginBottom: "8px",
                    }}
                  >
                    {t("preferredTimeLabel")}
                  </label>
                  <input
                    name="preferredAt"
                    type="datetime-local"
                    required
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      borderRadius: "16px",
                      border: "1px solid #cbd5e1",
                      background: "#f8fafc",
                    }}
                  />
                </div>
              )}
              <input
                name="district"
                placeholder={t("districtPlaceholder")}
                required
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                }}
              />
              <textarea
                name="addressNote"
                placeholder={t("addressPlaceholder")}
                required
                rows={3}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  resize: "none",
                }}
              />
              <textarea
                name="note"
                placeholder={t("notePlaceholder")}
                rows={3}
                style={{
                  width: "100%",
                  padding: "14px 16px",
                  borderRadius: "16px",
                  border: "1px solid #cbd5e1",
                  background: "#f8fafc",
                  resize: "none",
                }}
              />
              <button
                disabled={submitting}
                style={{
                  padding: "18px",
                  background: "#0284c7",
                  color: "#fff",
                  borderRadius: "16px",
                  border: "none",
                  fontWeight: 700,
                  cursor: submitting ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {submitting
                  ? t("submitting")
                  : kind === "doctor"
                  ? t("bookDoctorVisit")
                  : t("submitRequest")}
                {!submitting && <CaretRight size={20} weight="bold" />}
              </button>
            </form>
          )}

          {msg && (
            <div
              style={{
                marginTop: "16px",
                padding: "16px",
                borderRadius: "16px",
                background: actionStatus === "success" ? "#ecfdf5" : "#fef2f2",
                color: actionStatus === "success" ? "#047857" : "#b91c1c",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: 500,
                fontSize: "14px",
              }}
            >
              {actionStatus === "success" ? (
                <CheckCircle size={20} weight="fill" />
              ) : (
                <Info size={20} weight="fill" />
              )}
              {msg}
            </div>
          )}
        </ClientLockOverlay>
      </section>

      {(homeAppointments.length > 0 || visits.length > 0 || legacy.length > 0) && (
        <section
          style={{
            marginTop: "32px",
            background: "#fff",
            borderRadius: "32px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "24px 32px",
              borderBottom: "1px solid #e2e8f0",
              background: "#f8fafc",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>
              {t("recordsTitle")}
            </h2>
          </div>
          <div
            style={{
              padding: "24px 32px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            {homeAppointments.map((row) => (
              <div
                key={row.id}
                style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <strong style={{ display: "block", marginBottom: "8px" }}>
                  {row.doctorName} · {t("homeVisitDoctorSubtitle")}
                </strong>
                <span
                  style={{
                    display: "flex",
                    gap: "12px",
                    flexWrap: "wrap",
                    color: "#64748b",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <CalendarBlank size={16} />{" "}
                    {new Date(row.startsAt).toLocaleString(dateLocale)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MapPin size={16} />{" "}
                    {[row.visitDistrict, row.visitAddress].filter(Boolean).join(", ")}
                  </span>
                  <span>{getLocalizedAppointmentStatus(row.status)}</span>
                </span>
                <div style={{ marginTop: "10px" }}>
                  <Link
                    href="/appointments"
                    style={{ color: "#0284c7", fontWeight: 600, fontSize: "13px" }}
                  >
                    {t("manageInAppointments")}
                  </Link>
                </div>
              </div>
            ))}
            {visits.map((row) => (
              <div
                key={row.id}
                style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "20px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <strong style={{ display: "block", marginBottom: "8px" }}>
                    {row.providerName || getLocalizedKindTitle(row.title)} ·{" "}
                    {row.detail || row.title}
                  </strong>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    {row.city}
                    {row.district ? ` / ${row.district}` : ""}
                    {row.preferredAt
                      ? ` · ${new Date(row.preferredAt).toLocaleString(dateLocale)}`
                      : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      padding: "8px 16px",
                      borderRadius: "100px",
                      fontSize: "13px",
                      fontWeight: 700,
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    {getLocalizedVisitStatus(row.status, !!row.legacy)}
                  </span>
                  {(row.status === "REQUESTED" || row.status === "ACCEPTED") && (
                    <button
                      type="button"
                      onClick={() => cancelVisit(row.id)}
                      style={{
                        border: "none",
                        background: "#fee2e2",
                        color: "#b91c1c",
                        borderRadius: "12px",
                        padding: "8px 12px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {t("cancelAction")}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {legacy.map((row) => (
              <div
                key={row.id}
                style={{
                  padding: "20px",
                  background: "#fff",
                  borderRadius: "20px",
                  border: "1px dashed #cbd5e1",
                }}
              >
                <strong style={{ display: "block", marginBottom: "8px" }}>
                  {row.title}
                </strong>
                <span style={{ color: "#64748b", fontSize: "13px" }}>
                  {row.city}
                  {row.district ? ` / ${row.district}` : ""} ·{" "}
                  {getLocalizedVisitStatus(row.status, true)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
