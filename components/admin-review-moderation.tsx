'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';

export default function AdminReviewModeration() {
  const t = useTranslations('admin.reviewModeration');
  const [data, setData] = useState<any>({ organizationReviews: [], doctorReviews: [] });
  const [busy, setBusy] = useState('');

  async function load() {
    const r = await fetch('/api/admin/reviews');
    if (r.ok) setData(await r.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function act(kind: string, id: string, status: string) {
    setBusy(id);
    const reason = status === 'REJECTED' ? prompt(t('promptReason')) || '' : '';
    await fetch('/api/admin/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, id, status, reason }),
    });
    setBusy('');
    load();
  }

  const render = (kind: string, r: any, title: string) => (
    <div className="review-moderation-row" key={r.id}>
      <div>
        <span className="kicker">{title}</span>
        <b>{kind === 'organization' ? r.organization.name : r.doctor.name}</b>
        <p>
          {r.user.name} · {'★'.repeat(r.rating)}
        </p>
        <span>{r.comment || t('noComment')}</span>
      </div>
      <div className="row">
        <button className="secondary compact" disabled={busy === r.id} onClick={() => act(kind, r.id, 'REJECTED')}>
          {t('reject')}
        </button>
        <button className="primary compact" disabled={busy === r.id} onClick={() => act(kind, r.id, 'APPROVED')}>
          {t('publish')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="review-moderation-list">
      {data.organizationReviews.map((r: any) => render('organization', r, t('orgReviewTitle')))}
      {data.doctorReviews.map((r: any) => render('doctor', r, t('doctorReviewTitle')))}
      {!data.organizationReviews.length && !data.doctorReviews.length && (
        <div className="empty">{t('empty')}</div>
      )}
    </div>
  );
}
