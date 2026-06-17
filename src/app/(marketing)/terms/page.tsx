import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold">Terms</h1>
      <p className="mt-6 leading-7 text-muted-foreground">{DISCLAIMER_TEXT}</p>
      <p className="mt-4 leading-7 text-muted-foreground">
        Users are responsible for verifying all generated data, exported files and reported amounts before using them with any tax authority or professional advisor.
      </p>
    </section>
  );
}
