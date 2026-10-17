import SectionVisual from "@/components/section-visual";
import ReminderCalendar from "@/components/reminder-calendar";
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("health.reminderCalendar");
  return (
    <div className="page">
      <SectionVisual slug="calendar" alt={t("visualAlt")} />
      <ReminderCalendar />
    </div>
  );
}
