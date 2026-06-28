import { AuthForm } from "@/components/auth/AuthForm";
import { getI18n } from "@/lib/i18n/server";

type SignupPageProps = {
  searchParams: Promise<{
    next?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const { locale, t } = await getI18n();

  return (
    <AuthForm
      mode="signup"
      next={params.next}
      locale={locale}
      labels={{
        language: {
          en: t.language.english,
          fi: t.language.finnish,
          aria: t.language.label
        },
        auth: t.auth,
        nav: t.nav
      }}
    />
  );
}
