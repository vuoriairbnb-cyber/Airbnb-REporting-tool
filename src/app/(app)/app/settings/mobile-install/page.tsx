import { PageHeader } from "@/components/layout/PageHeader";

export default function MobileInstallPage() {
  return (
    <>
      <PageHeader
        title="Add to Home Screen"
        description="Install the web app on your phone for faster receipt capture."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border bg-background p-4">
          <h2 className="font-semibold">iPhone</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Open HostReport in Safari.</li>
            <li>Tap Share.</li>
            <li>Tap Add to Home Screen.</li>
            <li>Confirm Add.</li>
          </ol>
        </section>
        <section className="rounded-lg border bg-background p-4">
          <h2 className="font-semibold">Android</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Open HostReport in Chrome.</li>
            <li>Tap the menu.</li>
            <li>Tap Add to home screen or Install app.</li>
            <li>Confirm.</li>
          </ol>
        </section>
      </div>
    </>
  );
}
