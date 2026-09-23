"use client";
import { useEffect, useState } from "react";
import { appointmentPlaceLabel } from "@/lib/home-care";

type Slot = { id: string; startsAt: string; endsAt: string; type: string };

export default function DoctorAvailabilityManager() {
  const [items, setItems] = useState<Slot[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const response = await fetch("/api/doctor/availability");
    if (response.ok) setItems(await response.json());
  }

  useEffect(() => { load(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const date = String(data.get("date"));
    const start = String(data.get("start"));
    const end = String(data.get("end"));
    const response = await fetch("/api/doctor/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startsAt: new Date(`${date}T${start}:00`).toISOString(),
        endsAt: new Date(`${date}T${end}:00`).toISOString(),
        type: data.get("type"),
      }),
    });
    const body = await response.json();
    setMsg(response.ok ? "Müsaitlik eklendi." : body.error || "Eklenemedi");
    if (response.ok) { form.reset(); load(); }
  }

  return (
    <>
      <form className="panel-fields" onSubmit={submit}>
        <label className="field">
          <span>Tarih</span>
          <input type="date" name="date" required />
        </label>
        <label className="field">
          <span>Başlangıç</span>
          <input type="time" name="start" required />
        </label>
        <label className="field">
          <span>Bitiş</span>
          <input type="time" name="end" required />
        </label>
        <label className="field">
          <span>Görüşme türü</span>
          <select name="type" defaultValue="both">
            <option value="both">Online + Klinik</option>
            <option value="online">Online</option>
            <option value="clinic">Klinik</option>
            <option value="home">Evde</option>
          </select>
        </label>
        <button className="primary">Saat aç</button>
      </form>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="slot-list">
        {items.map((slot) => (
          <div className="slot-row" key={slot.id}>
            <div>
              <b>{new Date(slot.startsAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "short" })}</b>
              <span>{new Date(slot.startsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}–{new Date(slot.endsAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
            <span className="status">{slot.type === "both" ? "Online + Klinik" : appointmentPlaceLabel(slot.type)}</span>
          </div>
        ))}
      </div>
    </>
  );
}
