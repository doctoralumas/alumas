"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function Page() {
  const t = useTranslations('health.familyProfileDetail');
  const locale = useLocale();
  const dateLocale = locale === 'en' ? 'en-US' : 'tr-TR';
  const params = useParams<{ id: string }>();
  const id = String(params.id);
  const [data, setData] = useState<any>(null);
  const [msg, setMsg] = useState('');

  const load = () =>
    fetch('/api/health/family-tasks?profileId=' + id)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData);

  useEffect(() => {
    load();
  }, [id]);

  async function addTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch('/api/health/family-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId: id,
        title: f.get('title'),
        date: new Date(String(f.get('date'))).toISOString(),
      }),
    });
    const j = await r.json();
    setMsg(r.ok ? t('reminderAdded') : j.error || t('addFailed'));
    if (r.ok) {
      form.reset();
      load();
    }
  }

  if (!data) {
    return (
      <div className="page">
        <div className="empty">{t('loading')}</div>
      </div>
    );
  }

  const p = data.profile;
  const canRemind = data.access?.owner || data.access?.permissions?.includes('REMINDERS');

  return (
    <div className="page">
      <div className="page-title">
        <span className="kicker">{p.type === 'CHILD' ? t('kickerChild') : t('kickerPregnancy')}</span>
        <h1>{p.name}</h1>
        <p>{t('subtitle')}</p>
      </div>

      <div className="family-profile-actions-v22">
        <Link className="primary" href={`/doctors?profileId=${id}`}>
          {t('findDoctor')}
        </Link>
        <Link className="secondary" href={`/health/family?profile=${id}`}>
          {t('growthOrPregnancyRecord')}
        </Link>
        <Link className="secondary" href={`/health/vaccinations?profileId=${id}`}>
          {t('vaccinations')}
        </Link>
        <Link className="secondary" href={`/health/family/${id}/calendar`}>
          {t('profileCalendar')}
        </Link>
      </div>

      <section className="panel health-section">
        <h2>{t('newTaskTitle')}</h2>
        {canRemind ? (
          <form className="family-task-form-v22" onSubmit={addTask}>
            <input name="title" placeholder={t('taskPlaceholder')} required />
            <input name="date" type="datetime-local" required />
            <button className="primary">{t('remindButton')}</button>
          </form>
        ) : (
          <p className="muted">{t('noPermissionRemind')}</p>
        )}
        {msg && <div className="notice-v14">{msg}</div>}
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>{t('appointmentsTitle')}</h2>
          {data.appointments.map((a: any) => (
            <div className="family-row-v22" key={a.id}>
              <div>
                <b>{a.doctor.name}</b>
                <span>
                  {a.doctor.specialty} · {new Date(a.startsAt).toLocaleString(dateLocale)}
                </span>
              </div>
            </div>
          ))}
          {!data.appointments.length && <div className="empty">{t('noAppointments')}</div>}
        </section>

        <section className="panel">
          <h2>{t('remindersTitle')}</h2>
          {data.reminders.map((r: any) => (
            <div className="family-row-v22" key={r.id}>
              <div>
                <b>{r.title}</b>
                <span>{r.timeOfDay}</span>
              </div>
            </div>
          ))}
          {!data.reminders.length && <div className="empty">{t('noReminders')}</div>}
        </section>

        <section className="panel">
          <h2>{t('vaccinationsTitle')}</h2>
          {data.vaccinations.map((v: any) => (
            <div className="family-row-v22" key={v.id}>
              <div>
                <b>{v.vaccineName}</b>
                <span>
                  {new Date(v.administeredAt).toLocaleDateString(dateLocale)}
                  {v.nextDoseAt ? ` · ${t('nextDose', { date: new Date(v.nextDoseAt).toLocaleDateString(dateLocale) })}` : ''}
                </span>
              </div>
            </div>
          ))}
          {!data.vaccinations.length && <div className="empty">{t('noVaccinations')}</div>}
        </section>

        {p.type === 'PREGNANCY' && (
          <section className="panel">
            <h2>{t('pregnancyPlanTitle')}</h2>
            {data.pregnancyEvents.map((x: any) => (
              <div className="family-row-v22" key={x.id}>
                <div>
                  <b>{x.title}</b>
                  <span>{new Date(x.startsAt).toLocaleString(dateLocale)}</span>
                </div>
              </div>
            ))}
            {!data.pregnancyEvents.length && <div className="empty">{t('noPregnancyPlan')}</div>}
          </section>
        )}
      </div>
    </div>
  );
}
