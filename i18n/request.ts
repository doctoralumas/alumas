import { getRequestConfig } from "next-intl/server";
import { getUserLocale } from "@/lib/locale";
import { getMessagesForLocale } from "@/locales";

export default getRequestConfig(async () => {
  const locale = await getUserLocale();

  return {
    locale,
    messages: getMessagesForLocale(locale),
  };
});
