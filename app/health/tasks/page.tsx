import DiagnosticRequests from '@/components/diagnostic-requests';
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('health.healthTasks');
  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t('kicker')}</span>
        <h1>{t('title')}</h1>
        <p>{t('subtitlePatient')}</p>
      </div>
      <DiagnosticRequests />
    </div>
  );
}
