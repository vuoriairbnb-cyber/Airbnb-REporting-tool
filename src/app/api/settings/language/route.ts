import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { apiError, parseJsonBody } from "@/server/reporting/api";
import type { SupabaseReportingClient } from "@/server/reporting/db";

const updateLanguageSchema = z.object({
  language: z.enum(["en", "fi"])
});

export async function POST(request: Request) {
  const parsed = await parseJsonBody(request, updateLanguageSchema);

  if (parsed.error || !parsed.data) {
    return apiError(parsed.error ?? "Invalid language.", 400);
  }

  const language = normalizeLocale(parsed.data.language);
  const cookieStore = await cookies();

  cookieStore.set(LOCALE_COOKIE_NAME, language, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365
  });

  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user?.id) {
      await (supabase as unknown as SupabaseReportingClient)
        .from("profiles")
        .update({ language })
        .eq("id", user.id);
    }
  } catch {
    // Cookie language still works even if profile persistence is unavailable.
  }

  return NextResponse.json({ data: { language } });
}
