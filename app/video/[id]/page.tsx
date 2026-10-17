"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("appointments.video");
  const [id, setId] = useState("");
  const [room, setRoom] = useState<any>(null);
  const [err, setErr] = useState("");
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    params.then((p) => {
      setId(p.id);
      fetch("/api/video-consultations/" + p.id)
        .then((r) => r.json())
        .then(setRoom);
    });
  }, [params]);

  async function camera() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (video.current) video.current.srcObject = s;
    } catch {
      setErr(t("cameraError"));
    }
  }

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t("kicker")}</span>
        <h1>{t("title")}</h1>
        <p>
          {t("consultationWith", {
            doctor: room?.doctor?.name || t("defaultDoctor"),
            provider: room?.provider || t("loadingProvider"),
          })}
        </p>
      </div>

      {room?.roomUrl ? (
        <section className="panel">
          <iframe
            className="v24-video-frame"
            src={room.roomUrl}
            allow="camera; microphone; fullscreen; speaker; display-capture"
          />
          <p>{t("roomOpened")}</p>
        </section>
      ) : (
        <section className="panel">
          <h2>{t("devRoomTitle")}</h2>
          <p>{t("devRoomDesc")}</p>
          <video className="v24-local-video" ref={video} autoPlay muted playsInline />
          <button className="primary" onClick={camera}>
            {t("testCamera")}
          </button>
          {err && <p>{err}</p>}
        </section>
      )}
    </div>
  );
}
