"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";

type Slot = { id: string; startsAt: string; endsAt: string; type: string };
type Doc = {
  id: string;
  slug: string;
  name: string;
  specialty: string;
  price: number;
  availabilities: Slot[];
};

export default function OrganizationBooking({
  organizationId,
}: {
  organizationId: string;
}) {
  const router = useRouter();
  const t = useTranslations("appointments");
  const locale = useLocale();

  const [docs, setDocs] = useState<Doc[]>([]);
  const [doctor, setDoctor] = useState("all");
  const [slotKey, setSlotKey] = useState("");
  const [type, setType] = useState<"clinic" | "online">("clinic");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`/api/organizations/${organizationId}/availability`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setDocs);
  }, [organizationId]);

  const options = useMemo(
    () =>
      docs
        .flatMap((d) =>
          d.availabilities
            .filter((s) => s.type === "both" || s.type === type)
            .map((s) => ({
              doctorSlug: d.slug,
              doctorName: d.name,
              specialty: d.specialty,
              startsAt: s.startsAt,
              id: s.id,
            }))
        )
        .filter((x) => doctor === "all" || x.doctorSlug === doctor)
        .sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt)),
    [docs, doctor, type]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const chosen = options.find((x) => `${x.doctorSlug}|${x.startsAt}` === slotKey);
    if (!chosen) return;

    setStatus("submitting");
    setErrorMessage("");

    const r = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: chosen.doctorSlug,
        startsAt: chosen.startsAt,
        type,
        organizationId,
      }),
    });
    const j = await r.json();

    if (!r.ok) {
      setStatus("error");
      setErrorMessage(j.error || t("createFailed"));
      return;
    }

    setStatus("success");
    setTimeout(() => router.push("/appointments"), 500);
  }

  return (
    <form className="booking-card organization-booking" onSubmit={submit}>
      <span className="kicker">{t("orgBookingKicker")}</span>
      <h3>{t("orgBookingTitle")}</h3>

      <label>
        {t("specialistLabel")}
        <select
          value={doctor}
          onChange={(e) => {
            setDoctor(e.target.value);
            setSlotKey("");
          }}
        >
          <option value="all">{t("allSpecialists")}</option>
          {docs.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name} · {d.specialty}
            </option>
          ))}
        </select>
      </label>

      <div className="type-toggle">
        <button
          type="button"
          className={type === "clinic" ? "selected" : ""}
          onClick={() => {
            setType("clinic");
            setSlotKey("");
          }}
        >
          {t("typeClinic")}
        </button>
        <button
          type="button"
          className={type === "online" ? "selected" : ""}
          onClick={() => {
            setType("online");
            setSlotKey("");
          }}
        >
          {t("typeOnline")}
        </button>
      </div>

      <label>
        {t("availableSlotLabel")}
        <select
          required
          value={slotKey}
          onChange={(e) => setSlotKey(e.target.value)}
        >
          <option value="">{t("selectSlotPlaceholder")}</option>
          {options.map((s) => (
            <option
              key={`${s.doctorSlug}|${s.startsAt}`}
              value={`${s.doctorSlug}|${s.startsAt}`}
            >
              {new Date(s.startsAt).toLocaleString(
                locale === "en" ? "en-US" : "tr-TR",
                {
                  day: "numeric",
                  month: "long",
                  weekday: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                }
              )}{" "}
              · {s.doctorName}
            </option>
          ))}
        </select>
      </label>

      {!options.length && (
        <div className="slot-empty">{t("noSlotsForType")}</div>
      )}

      {status === "success" && (
        <div className="form-success">{t("createSuccess")}</div>
      )}
      {status === "error" && (
        <div className="form-error">{errorMessage}</div>
      )}

      <button
        className="primary full"
        disabled={!slotKey || status === "submitting"}
      >
        {status === "submitting" ? t("saving") : t("confirmButton")}
      </button>
    </form>
  );
}
