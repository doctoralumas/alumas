"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function PhoneLogin() {
  const t = useTranslations("auth");
  const r = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [msg, setMsg] = useState("");

  async function request() {
    setMsg("");
    const x = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const j = await x.json();
    if (!x.ok) return setMsg(j.error || t("errorSend"));
    setStep("code");
    setMsg(j.devCode ? t("devCode", { code: j.devCode }) : t("codeSent"));
  }

  async function verify() {
    const x = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, login: true }),
    });
    const j = await x.json();
    if (!x.ok) return setMsg(j.error || t("errorVerify"));
    r.push("/");
    r.refresh();
  }

  return (
    <div className="auth-card">
      <span className="kicker">{t("phoneLogin")}</span>
      <h1>{t("enterApp")}</h1>
      <label>
        {t("phoneLabel")}
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="555 123 45 67"
          disabled={step === "code"}
        />
      </label>
      {step === "code" && (
        <label>
          {t("codeLabel")}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
          />
        </label>
      )}
      {msg && <div className="inline-message">{msg}</div>}
      <button
        className="primary full"
        onClick={step === "phone" ? request : verify}
      >
        {step === "phone" ? t("sendCode") : t("submitLogin")}
      </button>
      {step === "code" && (
        <button
          className="secondary full auth-secondary"
          onClick={() => setStep("phone")}
        >
          {t("changePhone")}
        </button>
      )}
    </div>
  );
}