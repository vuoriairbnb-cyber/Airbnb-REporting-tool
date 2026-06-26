import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

const notes = [
  "HostReport organizes rental income, expenses, receipts and allocation assumptions for reporting preparation.",
  "AI receipt scanning creates draft data that users must review before saving.",
  "Candidate reportable amounts are calculated from user-entered totals and expense allocation percentages.",
  "Users remain responsible for checking exported information before reporting it."
];

const boundaries = [
  "No filing is submitted by this app.",
  "No bookkeeping service is performed by this app.",
  "No legal or accounting representation is provided.",
  "Receipt review and report review remain the user responsibility."
];

export default function DisclaimerPage() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-warm/10 text-warm">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <p className="mt-5 text-sm font-medium text-primary">Disclaimer</p>
        <h1 className="mt-2 text-4xl leading-tight md:text-5xl">
          Clear records help. Verification still belongs to the user.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          {DISCLAIMER_TEXT}
        </p>
      </div>

      <div className="mt-10">
        <DisclaimerBlock />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h2 className="text-xl">What the app helps organize</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-xl border border-border bg-surface p-4 text-sm"
              >
                {note}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warm" />
            <h2 className="text-xl">Important boundaries</h2>
          </div>
          <div className="mt-5 grid gap-3">
            {boundaries.map((boundary) => (
              <div
                key={boundary}
                className="rounded-xl border border-warm/30 bg-warm/10 p-4 text-sm"
              >
                {boundary}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
