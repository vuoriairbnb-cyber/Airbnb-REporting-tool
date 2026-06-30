import { redirect } from "next/navigation";
import { Clock3 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { getI18n } from "@/lib/i18n/server";
import { createClient } from "@/lib/supabase/server";
import { getApprovalStatus } from "@/server/reporting/approval";
import { getOnboardingStatus, isOnboardingComplete } from "@/server/reporting/onboarding";

export default async function PendingApprovalPage() {
  const { locale, t } = await getI18n();
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const approvalStatus = await getApprovalStatus(user.id);

  if (approvalStatus.approvedAt) {
    const onboardingStatus = await getOnboardingStatus();
    redirect(
      isOnboardingComplete(onboardingStatus) ? "/app/dashboard" : "/app/onboarding"
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-6">
        <header className="flex items-center justify-between gap-3">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitcher
              locale={locale}
              labels={{
                en: t.language.english,
                fi: t.language.finnish,
                aria: t.language.label
              }}
              compact
            />
            <LogoutButton
              labels={{
                logout: t.nav.logout,
                loggingOut: t.nav.loggingOut,
                error: "Could not log out."
              }}
            />
          </div>
        </header>

        <section className="my-auto rounded-2xl border border-border bg-card p-8 text-center shadow-card md:p-12">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary/10 text-primary">
            <Clock3 className="h-7 w-7" />
          </span>
          <h1 className="mt-6 text-3xl md:text-4xl">Account approval pending</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Your account has been created, but HostReport is still in development. Access
            to the app is enabled after the workspace owner approves your account in
            Supabase.
          </p>
          <div className="mt-8 rounded-xl border border-border bg-surface p-4 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">What happens next?</p>
            <p className="mt-2">
              After approval, refresh this page or log in again. You will continue to
              onboarding before using reporting preparation tools.
            </p>
          </div>
          <Button asChild className="mt-8">
            <a href="/login">{t.nav.login}</a>
          </Button>
        </section>
      </div>
    </main>
  );
}
