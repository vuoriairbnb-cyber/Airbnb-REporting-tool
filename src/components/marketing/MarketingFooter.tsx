import Link from "next/link";
import { Logo } from "@/components/Logo";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-surface/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 text-sm md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-muted-foreground">
            Income, expenses and receipts organized for reporting preparation. Built for
            small Airbnb and short-term rental hosts.
          </p>
          <p className="mt-4 text-xs text-muted-foreground">
            HostReport is not a tax, legal, accounting or bookkeeping service.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Product
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/features" className="hover:text-foreground">
                Features
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-foreground">
                Pricing
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Log in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-normal text-muted-foreground">
            Company
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/disclaimer" className="hover:text-foreground">
                Disclaimer
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-5 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} HostReport.</p>
          <p>Made for hosts preparing cleaner reports.</p>
        </div>
      </div>
    </footer>
  );
}
