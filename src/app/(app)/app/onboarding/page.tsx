import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/OnboardingForm";
import { getOnboardingStatus, isOnboardingComplete } from "@/server/reporting/onboarding";

export default async function OnboardingPage() {
  const status = await getOnboardingStatus();

  if (!status.userId) redirect("/login");
  if (isOnboardingComplete(status)) redirect("/app/dashboard");

  return <OnboardingForm status={status} />;
}
