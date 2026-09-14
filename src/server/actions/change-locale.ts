"use server";

import { Locale } from "@/i18n/request";
import { cookies } from "next/headers";

export async function changeLocaleAction(locale: Locale) {
  const store = await cookies();
  store.set("locale", locale);
}
