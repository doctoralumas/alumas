"use client";

import { imagingModalityLabel, labCategoryLabel, labSampleLabel } from "@/lib/organization-capabilities";
import { useLocale, useTranslations } from "next-intl";

type Service = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  variants?: { id: string; label: string; priceDelta?: number | null; durationMinutes?: number | null }[];
};

type Exam = {
  id: string;
  modality: string;
  name: string;
  bodyRegion?: string | null;
  preparation?: string | null;
  durationMinutes?: number | null;
  reportHours?: number | null;
  price?: number | null;
};

type LabTest = {
  id: string;
  category: string;
  sampleType: string;
  name: string;
  fastingHours?: number | null;
  turnaroundHours?: number | null;
  preparation?: string | null;
  price?: number | null;
};

function formatPrice(value: number | null | undefined, locale: string, fallbackText: string) {
  const numberLocale = locale === "en" ? "en-US" : "tr-TR";
  return value ? `${value.toLocaleString(numberLocale)} ₺` : fallbackText;
}

function ServiceList({
  title,
  intro,
  services,
  t,
  locale,
}: {
  title: string;
  intro: string;
  services: Service[];
  t: any;
  locale: string;
}) {
  const numberLocale = locale === "en" ? "en-US" : "tr-TR";

  return (
    <section className="panel">
      <h2>{title}</h2>
      <p>{intro}</p>
      <div className="slot-list">
        {services.map((service) => (
          <div className="slot-row" key={service.id}>
            <div>
              <b>{service.name}</b>
              <span>{service.description || ""}</span>
            </div>
            <div>
              <strong>{formatPrice(service.price, locale, t("askPrice"))}</strong>
              {!!service.variants?.length && (
                <div className="v26-variants">
                  {service.variants.map((variant) => (
                    <small key={variant.id}>
                      {variant.label}
                      {variant.priceDelta
                        ? ` · +${variant.priceDelta.toLocaleString(numberLocale)} ₺`
                        : ""}
                      {variant.durationMinutes
                        ? ` · ${variant.durationMinutes} ${t("minuteShort")}`
                        : ""}
                    </small>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {!services.length && <div className="empty">{t("emptyServices")}</div>}
      </div>
    </section>
  );
}

function ImagingCatalog({ exams, t, locale }: { exams: Exam[]; t: any; locale: string }) {
  const groups = exams.reduce<Record<string, Exam[]>>((acc, exam) => {
    acc[exam.modality] = acc[exam.modality] || [];
    acc[exam.modality].push(exam);
    return acc;
  }, {});

  return (
    <section className="panel">
      <h2>{t("imagingTitle")}</h2>
      <p>{t("imagingSubtitle")}</p>
      {!exams.length && <div className="empty">{t("emptyExams")}</div>}
      {Object.entries(groups).map(([modality, rows]) => (
        <div key={modality} style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{imagingModalityLabel(modality)}</h3>
          <div className="slot-list">
            {rows.map((exam) => (
              <div className="slot-row" key={exam.id}>
                <div>
                  <b>{exam.name}</b>
                  <span>
                    {[exam.bodyRegion, exam.preparation].filter(Boolean).join(" · ")}
                  </span>
                  <small>
                    {[
                      exam.durationMinutes
                        ? t("durationScan", { min: exam.durationMinutes })
                        : "",
                      exam.reportHours
                        ? t("reportHours", { hours: exam.reportHours })
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </div>
                <strong>{formatPrice(exam.price, locale, t("askPrice"))}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function LaboratoryCatalog({ tests, t, locale }: { tests: LabTest[]; t: any; locale: string }) {
  const groups = tests.reduce<Record<string, LabTest[]>>((acc, test) => {
    acc[test.category] = acc[test.category] || [];
    acc[test.category].push(test);
    return acc;
  }, {});

  return (
    <section className="panel">
      <h2>{t("labTitle")}</h2>
      <p>{t("labSubtitle")}</p>
      {!tests.length && <div className="empty">{t("emptyTests")}</div>}
      {Object.entries(groups).map(([category, rows]) => (
        <div key={category} style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{labCategoryLabel(category)}</h3>
          <div className="slot-list">
            {rows.map((test) => (
              <div className="slot-row" key={test.id}>
                <div>
                  <b>{test.name}</b>
                  <span>
                    {[labSampleLabel(test.sampleType), test.preparation]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  <small>
                    {[
                      test.fastingHours
                        ? t("fastingHours", { hours: test.fastingHours })
                        : t("noFastingRequired"),
                      test.turnaroundHours
                        ? t("turnaroundHours", { hours: test.turnaroundHours })
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </div>
                <strong>{formatPrice(test.price, locale, t("askPrice"))}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

export default function OrganizationOfferings({
  type,
  services,
  imagingExams,
  laboratoryTests,
}: {
  type: string;
  services: Service[];
  imagingExams?: Exam[];
  laboratoryTests?: LabTest[];
}) {
  const t = useTranslations("search.organizationProfile.offerings");
  const locale = useLocale();

  if (type === "LABORATORY") {
    return (
      <>
        <LaboratoryCatalog tests={laboratoryTests || []} t={t} locale={locale} />
        {!!services.length && (
          <ServiceList
            title={t("otherServices")}
            intro={t("labOtherIntro")}
            services={services}
            t={t}
            locale={locale}
          />
        )}
      </>
    );
  }
  if (type === "IMAGING_CENTER") {
    return (
      <>
        <ImagingCatalog exams={imagingExams || []} t={t} locale={locale} />
        {!!services.length && (
          <ServiceList
            title={t("otherServices")}
            intro={t("imagingOtherIntro")}
            services={services}
            t={t}
            locale={locale}
          />
        )}
      </>
    );
  }
  if (type === "PHARMACY") {
    if (!services.length) return null;
    return (
      <ServiceList
        title={t("pharmacyServicesTitle")}
        intro={t("pharmacyServicesIntro")}
        services={services}
        t={t}
        locale={locale}
      />
    );
  }
  if (type === "CLINIC") {
    return (
      <ServiceList
        title={t("clinicServicesTitle")}
        intro={t("clinicServicesIntro")}
        services={services}
        t={t}
        locale={locale}
      />
    );
  }
  return (
    <ServiceList
      title={t("hospitalServicesTitle")}
      intro={t("hospitalServicesIntro")}
      services={services}
      t={t}
      locale={locale}
    />
  );
}
