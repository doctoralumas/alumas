"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function Page() {
  const t = useTranslations('health.familyProfileDetail');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-US' : 'tr-TR';
  const { id } = useParams<{ id: string }>();
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [d, setD] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/calendar?date=${date}&profileId=${encodeURIComponent(String(id))}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setD);
  }, [date, id]);

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{t('calendarPageKicker')}</span>
        <h1>{t('calendarPageTitle')}</h1>
        <p>{t('calendarPageSubtitle')}</p>
      </div>

      <div className="date-filter-v16">
        <label>
          {t('dateFilterLabel')}
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <Link className="secondary" href={`/health/family/${id}`}>
          {t('backToProfile')}
        </Link>
      </div>

      {!d ? (
        <div className="empty">{t('calendarLoading')}</div>
      ) : (
        <div className="timeline-v22">
          <section className="panel">
            <h2>{t('appointmentsTitle')}</h2>
            {d.appointments.map((x: any) => (
              <div className="family-row-v22" key={x.id}>
                <div>
                  <b>{x.doctor.name}</b>
                  <span>{new Date(x.startsAt).toLocaleString(dateLocale)}</span>
                </div>
              </div>
            ))}
            {!d.appointments.length && <div className="empty">{t('noAppointmentsShort')}</div>}
          </section>

          <section className="panel">
            <h2>{t('remindersTitle')}</h2>
            {d.reminders.map((x: any) => (
              <div className="family-row-v22" key={x.id}>
                <div>
                  <b>{x.title}</b>
                  <span>{x.timeOfDay}</span>
                </div>
              </div>
            ))}
            {!d.reminders.length && <div className="empty">{t('noRemindersShort')}</div>}
          </section>

          <section className="panel">
            <h2>{t('vaccinationOrPregnancyTitle')}</h2>
            {d.vaccinations.map((x: any) => (
              <div className="family-row-v22" key={x.id}>
                <div>
                  <b>{x.vaccineName}</b>
                  <span>
                    {x.nextDoseAt ? new Date(x.nextDoseAt).toLocaleDateString(dateLocale) : t('vaccineRecordLabel')}
                  </span>
                </div>
              </div>
            ))}
            {d.pregnancyEvents.map((x: any) => (
              <div className="family-row-v22" key={x.id}>
                <div>
                  <b>{x.title}</b>
                  <span>{new Date(x.startsAt).toLocaleString(dateLocale)}</span>
                </div>
              </div>
            ))}
            {!d.vaccinations.length && !d.pregnancyEvents.length && (
              <div className="empty">{t('noRecordsShort')}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
