"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Video, CheckCircle2 } from "./icons";
import { useTranslations, useFormatter } from "next-intl";

type Slot = { id: string; startsAt: string; endsAt: string; type: string };

export default function BookAppointment({
  doctorId,
  specialProfileId,
}: {
  doctorId: string;
  doctorName: string;
  specialty: string;
  specialProfileId?: string;
}) {
  const t = useTranslations("appointments");
  const format = useFormatter();
  const router = useRouter();

  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState("");
  const [type, setType] = useState<"online" | "clinic">("online");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error" | "auth_required">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    fetch(`/api/doctors/${doctorId}/availability`)
      .then(async (r) => (r.ok ? r.json() : []))
      .then(setSlots)
      .catch(() => setSlots([]));
  }, [doctorId]);

  const compatible = useMemo(
    () => slots.filter((s) => s.type === "both" || s.type === type),
    [slots, type]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;

    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId,
          startsAt: selected,
          type,
          specialProfileId: specialProfileId || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));
      setLoading(false);

      if (res.status === 401) {
        setStatus("auth_required");
        return;
      }

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(json.error || t("createFailed"));
        return;
      }

      setStatus("success");
      setTimeout(() => router.push("/appointments"), 600);
    } catch {
      setLoading(false);
      setStatus("error");
      setErrorMessage(t("createFailed"));
    }
  }

  return (
    <form className="booking-card" onSubmit={submit}>
      <h3>{t("bookingTitle")}</h3>
      {specialProfileId && (
        <div className="family-context-v22">{t("familyContext")}</div>
      )}

      <div className="type-toggle">
        <button
          type="button"
          onClick={() => {
            setType("online");
            setSelected("");
          }}
          className={type === "online" ? "selected" : ""}
        >
          <Video size={17} /> {t("typeOnline")}
        </button>
        <button
          type="button"
          onClick={() => {
            setType("clinic");
            setSelected("");
          }}
          className={type === "clinic" ? "selected" : ""}
        >
          <CalendarDays size={17} /> {t("typeClinic")}
        </button>
      </div>

      <label>
        {t("availableSlotLabel")}
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          required
        >
          <option value="">{t("selectSlotPlaceholder")}</option>
          {compatible.map((s) => (
            <option value={s.startsAt} key={s.id}>
              {format.dateTime(new Date(s.startsAt), {
                day: "numeric",
                month: "long",
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </option>
          ))}
        </select>
      </label>

      {compatible.length === 0 && (
        <div className="slot-empty">{t("noSlotsAvailable")}</div>
      )}

      {status === "auth_required" && (
        <div className="form-error">
          {t("loginRequired")}{" "}
          <Link href="/login">{t("loginLink")}</Link>
        </div>
      )}

      {status === "error" && (
        <div className="form-error">{errorMessage}</div>
      )}

      {status === "success" && (
        <div className="form-success">{t("createSuccess")}</div>
      )}

      <button
        className="primary full"
        disabled={loading || !selected || status === "success"}
      >
        {loading ? (
          t("saving")
        ) : status === "success" ? (
          <>
            <CheckCircle2 size={18} /> {t("confirmedButton")}
          </>
        ) : (
          t("confirmButton")
        )}
      </button>
    </form>
  );
}
