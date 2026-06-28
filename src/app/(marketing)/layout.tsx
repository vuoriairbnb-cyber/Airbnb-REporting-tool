import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";

export default async function MarketingLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  const { locale, t } = await getI18n();

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader
        isAuthenticated={Boolean(user)}
        locale={locale}
        labels={{
          language: {
            en: t.language.english,
            fi: t.language.finnish,
            aria: t.language.label
          },
          nav: t.nav
        }}
      />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
