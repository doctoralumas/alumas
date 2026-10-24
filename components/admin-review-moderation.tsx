'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import AdminConfirmDialog from '@/components/admin/admin-confirm-dialog';

export default function AdminReviewModeration() {
  const t = useTranslations('admin.reviewModeration');
  const [data, setData] = useState<any>({ organizationReviews: [], doctorReviews: [] });
  const [busy, setBusy] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    kind: string;
    id: string;
    status: string;
    title: string;
    description: string;
    requireReason: boolean;
    variant: 'danger' | 'primary';
  } | null>(null);

  async function load() {
    const r = await fetch('/api/admin/reviews');
    if (r.ok) setData(await r.json());
  }

  useEffect(() => {
    load();
  }, []);

  function promptAction(kind: string, r: any, status: string) {
    const targetName = kind === 'organization' ? r.organization?.name : r.doctor?.name;
    const reviewerName = r.user?.name || '';
    if (status === 'REJECTED') {
      setConfirmDialog({
        kind,
        id: r.id,
        status: 'REJECTED',
        title: t('reject'),
        description: `${reviewerName} (${targetName}) değerlendirmesini reddetmek üzeresiniz.`,
        requireReason: false,
        variant: 'danger',
      });
    } else {
      setConfirmDialog({
        kind,
        id: r.id,
        status: 'APPROVED',
        title: t('publish'),
        description: `${reviewerName} tarafından ${targetName} için yapılan bu değerlendirmeyi onaylayıp yayınlamak üzeresiniz.`,
        requireReason: false,
        variant: 'primary',
      });
    }
  }

  async function handleConfirm(reason?: string) {
    if (!confirmDialog) return;
    setBusy(confirmDialog.id);
    try {
      await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: confirmDialog.kind,
          id: confirmDialog.id,
          status: confirmDialog.status,
          reason: reason || '',
        }),
      });
    } finally {
      setBusy('');
      setConfirmDialog(null);
      load();
    }
  }

  const render = (kind: string, r: any, title: string) => (
    <div className="review-moderation-row" key={r.id}>
      <div>
        <span className="kicker">{title}</span>
        <b>{kind === 'organization' ? r.organization?.name : r.doctor?.name}</b>
        <p>
          {r.user?.name} · {'★'.repeat(r.rating || 0)}
        </p>
        <span>{r.comment || t('noComment')}</span>
      </div>
      <div className="row">
        <button
          className="secondary compact"
          disabled={busy === r.id}
          onClick={() => promptAction(kind, r, 'REJECTED')}
        >
          {t('reject')}
        </button>
        <button
          className="primary compact"
          disabled={busy === r.id}
          onClick={() => promptAction(kind, r, 'APPROVED')}
        >
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

      {confirmDialog && (
        <AdminConfirmDialog
          isOpen={true}
          onClose={() => setConfirmDialog(null)}
          onConfirm={handleConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          variant={confirmDialog.variant}
          confirmLabel={confirmDialog.status === 'REJECTED' ? t('reject') : t('publish')}
          showReasonInput={confirmDialog.status === 'REJECTED'}
          reasonPlaceholder={t('promptReason')}
          isBusy={busy === confirmDialog.id}
        />
      )}
    </div>
  );
}
