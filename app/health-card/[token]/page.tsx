export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const row = await prisma.emergencyHealthCard.findUnique({
    where: { shareToken: token },
    include: { user: { select: { name: true } } },
  });
  if (!row?.sharingEnabled) notFound();
  const t = await getTranslations('health.healthCardPublic');

  return (
    <div className="page public-card-v19">
      <div className="page-title">
        <span className="kicker">{t('kicker')}</span>
        <h1>{row.user.name}</h1>
        <p>{t('subtitle')}</p>
      </div>
      <div className="dashboard-grid">
        <section className="panel">
          <h2>{t('bloodType')}</h2>
          <strong className="emergency-value-v19">{row.bloodType || t('notSpecified')}</strong>
        </section>
        <section className="panel">
          <h2>{t('allergies')}</h2>
          <p>{row.allergies.join(', ') || t('notSpecified')}</p>
        </section>
        <section className="panel">
          <h2>{t('chronicConditions')}</h2>
          <p>{row.chronicConditions.join(', ') || t('notSpecified')}</p>
        </section>
        <section className="panel">
          <h2>{t('importantMedications')}</h2>
          <p>{row.medicationsSummary.join(', ') || t('notSpecified')}</p>
        </section>
        <section className="panel">
          <h2>{t('emergencyContact')}</h2>
          <p>
            {row.emergencyContactName || '—'}
            <br />
            {row.emergencyContactPhone || '—'}
          </p>
        </section>
        <section className="panel">
          <h2>{t('note')}</h2>
          <p>{row.notes || '—'}</p>
        </section>
      </div>
      <div className="notice-v14">{t('disclaimer')}</div>
    </div>
  );
}
