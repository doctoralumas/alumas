"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function CookieConsent() {
  const t = useTranslations("cookieConsent");
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(!localStorage.getItem("alumas_cookie_v1"));
  }, []);

  function save(v: string) {
    localStorage.setItem("alumas_cookie_v1", v);
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="cookie-banner">
      <div>
        <b>{t("title")}</b>
        <p>{t("desc")}</p>
        <Link href="/cookies">{t("policyLink")}</Link>
      </div>
      <div className="cookie-actions">
        <button onClick={() => save("necessary")}>{t("onlyNecessary")}</button>
        <button className="primary" onClick={() => save("optional-ok")}>
          {t("acceptOptional")}
        </button>
      </div>
    </div>
  );
}