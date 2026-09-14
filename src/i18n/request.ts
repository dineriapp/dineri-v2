import { LanguageCode } from "@/components/ui/ui-kit/LanguageSwitcher";
import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";

export type Locale = LanguageCode;

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale: Locale = (store.get("locale")?.value || "en") as Locale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
