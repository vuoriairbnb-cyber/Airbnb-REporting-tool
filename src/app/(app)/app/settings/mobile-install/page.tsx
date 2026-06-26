import { Smartphone } from "lucide-react";
import { Pill } from "@/components/app/primitives";

const guides = [
  {
    os: "iPhone",
    steps: [
      "Open this page in Safari",
      "Tap Share",
      "Tap Add to Home Screen",
      "Confirm Add"
    ]
  },
  {
    os: "Android",
    steps: [
      "Open in Chrome",
      "Tap menu",
      "Tap Add to Home screen or Install app",
      "Confirm"
    ]
  }
];

export default function MobileInstallPage() {
  return (
    <div className="space-y-5">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Settings</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">
          Add to Home Screen
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Install the web app on your phone for faster receipt capture and reporting
          preparation.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-lg">Mobile install guide</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Use HostReport in standalone mode from your home screen.
              </p>
            </div>
          </div>
          <Pill tone="bg-primary/10 text-primary">PWA ready</Pill>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {guides.map((guide) => (
            <div
              key={guide.os}
              className="rounded-xl border border-border bg-surface/60 p-4"
            >
              <p className="font-medium">{guide.os}</p>
              <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
                {guide.steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
