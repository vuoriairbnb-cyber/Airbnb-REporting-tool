import { AppShell } from "@/components/layout/AppShell";
import { getI18n } from "@/lib/i18n/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getI18n();

  return (
    <AppShell
      locale={locale}
      labels={{
        language: {
          en: t.language.english,
          fi: t.language.finnish,
          aria: t.language.label
        },
        nav: t.nav,
        workspace: t.common.workspace
      }}
    >
      {children}
    </AppShell>
  );
}
