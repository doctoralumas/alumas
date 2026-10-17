"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export function FavoriteOrganization({ id }: { id: string }) {
  const t = useTranslations("discovery");
  const [fav, setFav] = useState(false);

  useEffect(() => {
    fetch(`/api/organizations/${id}/favorite`)
      .then((r) => r.json())
      .then((x) => setFav(!!x.favorite));
  }, [id]);

  async function toggle() {
    const r = await fetch(`/api/organizations/${id}/favorite`, {
      method: fav ? "DELETE" : "POST",
    });
    if (r.status === 401) {
      alert(t("favoriteLoginRequired"));
      return;
    }
    if (r.ok) setFav(!fav);
  }

  return (
    <button className="secondary compact" onClick={toggle}>
      {fav ? t("favoriteAdded") : t("favoriteAddOrg")}
    </button>
  );
}

export function OrganizationReviews({ id }: { id: string }) {
  const t = useTranslations("discovery");
  const [data, setData] = useState<any>({ average: 0, count: 0, reviews: [] });
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState("");

  async function load() {
    const r = await fetch(`/api/organizations/${id}/reviews`);
    if (r.ok) setData(await r.json());
  }

  useEffect(() => {
    load();
  }, [id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/organizations/${id}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });
    if (r.status === 401) {
      alert(t("reviewLoginRequired"));
      return;
    }
    const x = await r.json();
    if (r.ok) {
      setComment("");
      setMsg(x.message || t("reviewSuccess"));
      load();
    } else {
      setMsg(x.error || t("reviewFailed"));
    }
  }

  return (
    <section className="panel health-section">
      <div className="row between">
        <h2>{t("orgReviewsTitle")}</h2>
        <strong>
          ★ {data.average || "—"} <small>({data.count})</small>
        </strong>
      </div>
      <form className="review-form" onSubmit={submit}>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {t("starRating", { count: n })}
            </option>
          ))}
        </select>
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t("orgReviewPlaceholder")}
        />
        <button className="primary">{t("submitReview")}</button>
      </form>
      {msg && <div className="inline-message">{msg}</div>}
      <div className="review-list">
        {data.reviews.map((r: any) => (
          <div className="review-row" key={r.id}>
            <b>
              {r.userName} · {"★".repeat(r.rating)}
            </b>
            <span>{r.comment || t("noComment")}</span>
          </div>
        ))}
        {!data.reviews.length && <div className="empty">{t("noOrgReviews")}</div>}
      </div>
    </section>
  );
}
