"use client";
import { labPanelTemplates } from "@/lib/lab-panels";
import { useTranslations } from "next-intl";

export default function LabPanelTemplates({
  onPick,
}: {
  onPick: (panel: string, test: string, unit?: string) => void;
}) {
  const t = useTranslations("health.labPanelTemplates");
  return (
    <section className="panel health-section">
      <h2>{t("title")}</h2>
      <p>{t("subtitle")}</p>
      <div className="lab-template-grid-v18">
        {labPanelTemplates.map((p) => {
          const panelName = t.has(`panels.${p.id}.name`) ? t(`panels.${p.id}.name`) : p.name;
          const panelDesc = t.has(`panels.${p.id}.description`) ? t(`panels.${p.id}.description`) : p.description;
          return (
            <article key={p.id}>
              <b>{panelName}</b>
              <span>{panelDesc}</span>
              <div>
                {p.tests.map((tItem) => {
                  const testName = t.has(`panels.${p.id}.tests.${tItem.id}`)
                    ? t(`panels.${p.id}.tests.${tItem.id}`)
                    : tItem.name;
                  return (
                    <button
                      className="secondary compact"
                      key={tItem.id}
                      onClick={() => onPick(panelName, testName, tItem.unit)}
                    >
                      {testName}
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
