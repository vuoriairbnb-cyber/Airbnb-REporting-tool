import { Download, FileArchive } from "lucide-react";
import { AppEmptyState, Pill, SectionCard } from "@/components/app/primitives";
import { DisclaimerBlock } from "@/components/marketing/DisclaimerBlock";
import { ReportCreateForm } from "@/components/reports/ReportCreateForm";
import { ReportList } from "@/components/reports/ReportList";
import { Button } from "@/components/ui/button";
import { getCategories, getProperties, getReports } from "@/server/reporting/queries";

async function safeList<T>(loader: () => Promise<T[]>) {
  try {
    return await loader();
  } catch {
    return [];
  }
}

export default async function ReportsPage() {
  const [properties, categories, reports] = await Promise.all([
    safeList(getProperties),
    safeList(getCategories),
    safeList(getReports)
  ]);

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">Reporting preparation</p>
        <h1 className="mt-1 font-display text-2xl leading-tight md:text-3xl">Reports</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Generate tax-preparation reports, allocation reports and receipt archive
          packages for review.
        </p>
      </div>

      <DisclaimerBlock compact />

      <ReportCreateForm properties={properties} categories={categories} />

      <SectionCard
        title="Previous reports"
        action={
          <Pill
            tone={
              reports.length
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            }
          >
            {reports.length
              ? `${reports.length} report${reports.length === 1 ? "" : "s"}`
              : "No generated reports"}
          </Pill>
        }
        className="overflow-hidden p-0"
      >
        {reports.length ? (
          <ReportList reports={reports} />
        ) : (
          <>
            <AppEmptyState
              title="No previous reports"
              body="Generate your first tax-preparation report, allocation report or receipt archive to see download-ready files here."
              action={
                <Button variant="outline" disabled>
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              }
            />
            <div className="sr-only">
              <FileArchive className="h-4 w-4" />
              Report statuses include pending, processing, ready and failed.
            </div>
          </>
        )}
      </SectionCard>
    </div>
  );
}
