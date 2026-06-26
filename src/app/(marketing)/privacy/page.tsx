const sections = [
  {
    title: "Data used by the app",
    body: "HostReport stores account, property, income, expense, receipt and report data to provide the reporting preparation service."
  },
  {
    title: "Receipt files",
    body: "Receipt originals, previews and generated reports are intended to be stored in private Supabase Storage buckets with user-scoped access."
  },
  {
    title: "AI processing",
    body: "Receipt scanning can send receipt content to an AI provider once that feature is enabled. Extracted data should remain a draft until reviewed."
  },
  {
    title: "Payments",
    body: "Subscription checkout and billing portal flows are handled by Stripe in test mode during development. Payment card details are not stored by HostReport."
  },
  {
    title: "Data deletion",
    body: "During private beta, account and workspace deletion requests are handled manually. Receipt files and generated reports are kept in private storage while a deletion request is reviewed."
  }
];

export default function PrivacyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="max-w-3xl">
        <p className="text-sm font-medium text-primary">Privacy</p>
        <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Privacy overview</h1>
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          This placeholder privacy page summarizes the data categories the product is
          designed to handle. It should be reviewed before production launch.
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border bg-card p-6 shadow-card"
          >
            <h2 className="font-semibold">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </section>
  );
}
