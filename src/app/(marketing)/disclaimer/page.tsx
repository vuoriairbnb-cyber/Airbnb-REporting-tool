import { ShieldCheck } from "lucide-react";
import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

const notes = [
  "HostReport organizes rental income, expense, receipt and allocation records for preparation.",
  "AI receipt scanning creates draft data that users must review before saving.",
  "Candidate reportable amounts are calculated from user-entered totals and allocation percentages.",
  "Users remain responsible for checking exported information before reporting it."
];

export default function DisclaimerPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-14">
      <div className="max-w-3xl">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Disclaimer</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground">
          {DISCLAIMER_TEXT}
        </p>
      </div>

      <div className="mt-8 grid gap-3">
        {notes.map((note) => (
          <div key={note} className="rounded-lg border bg-background p-4 text-sm">
            {note}
          </div>
        ))}
      </div>
    </section>
  );
}
