import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
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

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader isAuthenticated={Boolean(user)} />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
