import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

const terms = [
  {
    title: "User responsibility",
    body: "Users are responsible for reviewing income, expenses, receipts, allocations, candidate reportable amounts and exports before using them."
  },
  {
    title: "Preparation tool",
    body: "HostReport is designed as a tax-preparation reports organizer for small hosts, not as a filing system or bookkeeping ledger."
  },
  {
    title: "Generated files",
    body: "CSV, PDF and ZIP outputs are preparation files. Users should verify the contents before sharing or reporting them."
  },
  {
    title: "Subscriptions",
    body: "Pricing plans are placeholders until Stripe Checkout and billing flows are connected."
  }
];

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Terms</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Terms overview</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {DISCLAIMER_TEXT}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {terms.map((term) => (
          <section key={term.title} className="rounded-lg border bg-background p-5">
            <h2 className="font-semibold">{term.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{term.body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
