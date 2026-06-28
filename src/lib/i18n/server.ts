import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getDictionary,
  LOCALE_COOKIE_NAME,
  normalizeLocale,
  type Dictionary,
  type Locale
} from "@/lib/i18n";
import type { SupabaseReportingClient } from "@/server/reporting/db";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;

  if (cookieLocale) return normalizeLocale(cookieLocale);

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user?.id) return "en";

    const { data } = await (supabase as unknown as SupabaseReportingClient)
      .from("profiles")
      .select("language")
      .eq("id", user.id)
      .single();

    return normalizeLocale((data as { language?: string | null } | null)?.language);
  } catch {
    return "en";
  }
}

export async function getI18n(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();

  return {
    locale,
    t: getDictionary(locale)
  };
}
