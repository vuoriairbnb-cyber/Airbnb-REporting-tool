import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm text-muted-foreground md:grid-cols-2">
        <p>
          HostReport organizes reporting preparation data for short-term rental hosts.
        </p>
        <nav className="flex flex-wrap gap-4 md:justify-end">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/disclaimer">Disclaimer</Link>
        </nav>
      </div>
    </footer>
  );
}
