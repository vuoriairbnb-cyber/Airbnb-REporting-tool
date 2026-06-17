import { DISCLAIMER_TEXT } from "@/lib/constants/disclaimer";

export default function DisclaimerPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold">Disclaimer</h1>
      <p className="mt-6 leading-7 text-muted-foreground">{DISCLAIMER_TEXT}</p>
    </section>
  );
}
