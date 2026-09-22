import { imagingModalityLabel, labCategoryLabel, labSampleLabel } from "@/lib/organization-capabilities";

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

function money(value?: number | null) {
  return value ? `${value.toLocaleString("tr-TR")} ₺` : "Fiyat sorunuz";
}

function ServiceList({ title, intro, services }: { title: string; intro: string; services: Service[] }) {
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
              <strong>{money(service.price)}</strong>
              {!!service.variants?.length && (
                <div className="v26-variants">
                  {service.variants.map((variant) => (
                    <small key={variant.id}>
                      {variant.label}
                      {variant.priceDelta ? ` · +${variant.priceDelta.toLocaleString("tr-TR")} ₺` : ""}
                      {variant.durationMinutes ? ` · ${variant.durationMinutes} dk` : ""}
                    </small>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {!services.length && <div className="empty">Henüz hizmet eklenmemiş.</div>}
      </div>
    </section>
  );
}

function ImagingCatalog({ exams }: { exams: Exam[] }) {
  const groups = exams.reduce<Record<string, Exam[]>>((acc, exam) => {
    acc[exam.modality] = acc[exam.modality] || [];
    acc[exam.modality].push(exam);
    return acc;
  }, {});
  return (
    <section className="panel">
      <h2>Tetkikler</h2>
      <p>Görüntüleme türü, hazırlık, çekim süresi ve rapor süresini merkez belirler.</p>
      {!exams.length && <div className="empty">Henüz tetkik yayınlanmamış.</div>}
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
                      exam.durationMinutes ? `${exam.durationMinutes} dk çekim` : "",
                      exam.reportHours ? `rapor ${exam.reportHours} saat` : "",
                    ].filter(Boolean).join(" · ")}
                  </small>
                </div>
                <strong>{money(exam.price)}</strong>
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function LaboratoryCatalog({ tests }: { tests: LabTest[] }) {
  const groups = tests.reduce<Record<string, LabTest[]>>((acc, test) => {
    acc[test.category] = acc[test.category] || [];
    acc[test.category].push(test);
    return acc;
  }, {});
  return (
    <section className="panel">
      <h2>Tahliller</h2>
      <p>Numune türü, açlık koşulu ve sonuç süresini laboratuvar belirler.</p>
      {!tests.length && <div className="empty">Henüz tahlil yayınlanmamış.</div>}
      {Object.entries(groups).map(([category, rows]) => (
        <div key={category} style={{ marginTop: 16 }}>
          <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>{labCategoryLabel(category)}</h3>
          <div className="slot-list">
            {rows.map((test) => (
              <div className="slot-row" key={test.id}>
                <div>
                  <b>{test.name}</b>
                  <span>
                    {[labSampleLabel(test.sampleType), test.preparation].filter(Boolean).join(" · ")}
                  </span>
                  <small>
                    {[
                      test.fastingHours ? `${test.fastingHours} saat açlık` : "Açlık gerekmez",
                      test.turnaroundHours ? `sonuç ${test.turnaroundHours} saat` : "",
                    ].filter(Boolean).join(" · ")}
                  </small>
                </div>
                <strong>{money(test.price)}</strong>
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
  if (type === "LABORATORY") {
    return (
      <>
        <LaboratoryCatalog tests={laboratoryTests || []} />
        {!!services.length && (
          <ServiceList
            title="Diğer kayıtlı hizmetler"
            intro="Laboratuvarın daha önce yayınladığı genel hizmet kayıtları."
            services={services}
          />
        )}
      </>
    );
  }
  if (type === "IMAGING_CENTER") {
    return (
      <>
        <ImagingCatalog exams={imagingExams || []} />
        {!!services.length && (
          <ServiceList
            title="Diğer kayıtlı hizmetler"
            intro="Merkezin daha önce yayınladığı genel hizmet kayıtları."
            services={services}
          />
        )}
      </>
    );
  }
  if (type === "PHARMACY") {
    if (!services.length) return null;
    return (
      <ServiceList
        title="Eczane hizmetleri"
        intro="Eczanenin yayınladığı ek hizmetler."
        services={services}
      />
    );
  }
  if (type === "CLINIC") {
    return (
      <ServiceList
        title="Muayene ve işlemler"
        intro="Kliniğin sunduğu muayene ve işlemler."
        services={services}
      />
    );
  }
  return (
    <ServiceList
      title="Sunulan hizmetler"
      intro="Hastanenin yayınladığı klinik hizmetler."
      services={services}
    />
  );
}
