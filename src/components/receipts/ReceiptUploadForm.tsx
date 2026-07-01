"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud } from "lucide-react";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/button";
import { Field, selectClassName } from "@/components/forms/Field";
import { ReceiptImagePreprocessStep } from "@/components/receipts/ReceiptImagePreprocessStep";
import { FailureState } from "@/components/state/FailureState";
import { LoadingState } from "@/components/state/LoadingState";
import type { Dictionary } from "@/lib/i18n";
import { parseApiError } from "@/lib/api/client";
import { isProcessableReceiptImage } from "@/lib/receipts/image-preprocessing";
import { createClient } from "@/lib/supabase/client";
import type { PropertyRow } from "@/server/reporting/types";

const acceptedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
export function ReceiptUploadForm({
  properties,
  labels
}: {
  properties: PropertyRow[];
  labels: {
    receipts: Dictionary["receipts"];
    common: Dictionary["common"];
  };
}) {
  const router = useRouter();
  const feedback = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [scanMode, setScanMode] = useState<"standard" | "plus" | "pro">("standard");
  const [error, setError] = useState<string | null>(null);
  const [needsAiConsent, setNeedsAiConsent] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileLabel = useMemo(() => {
    if (!file) return labels.receipts.chooseFile;

    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file, labels.receipts.chooseFile]);

  function selectFile(nextFile?: File) {
    setError(null);
    setNeedsAiConsent(false);

    if (!nextFile) return;

    if (!acceptedMimeTypes.includes(nextFile.type)) {
      setError("Use a JPG, PNG, WEBP or PDF receipt.");
      return;
    }

    setFile(nextFile);
  }

  function chooseAnotherFile() {
    setFile(null);
    setError(null);
    setNeedsAiConsent(false);
  }

  async function uploadAndScan(uploadFile: File) {
    setError(null);
    setNeedsAiConsent(false);

    if (!uploadFile) {
      setError("Choose a receipt first.");
      return;
    }

    setIsPending(true);

    const createResponse = await fetch("/api/uploads/create-source-document", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fileName: uploadFile.name,
        mimeType: uploadFile.type,
        fileSizeBytes: uploadFile.size,
        propertyId: propertyId || null
      })
    });

    if (!createResponse.ok) {
      setError(await parseApiError(createResponse, "Could not prepare upload."));
      setIsPending(false);
      return;
    }

    const { data } = await createResponse.json();
    const supabase = createClient();
    const upload = await supabase.storage
      .from(data.bucket)
      .upload(data.uploadPath, uploadFile, {
        contentType: uploadFile.type,
        upsert: false
      });

    if (upload.error) {
      await fetch("/api/uploads/create-source-document", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceDocumentId: data.sourceDocumentId,
          errorMessage: upload.error.message
        })
      }).catch(() => null);
      setError(
        `Receipt upload failed before AI extraction could start. ${upload.error.message}`
      );
      setIsPending(false);
      return;
    }

    const parseResponse = await fetch("/api/ai/parse-receipt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceDocumentId: data.sourceDocumentId,
        scanMode
      })
    });

    setIsPending(false);

    if (!parseResponse.ok) {
      const message = await parseApiError(parseResponse, "Could not parse receipt.");
      setNeedsAiConsent(
        message === "AI processing consent is required before parsing receipts."
      );
      setError(message);
      return;
    }

    const parsed = await parseResponse.json();
    feedback.success({ title: "Receipt scanned." });
    router.push(`/app/receipts/${parsed.data.receiptId}/review`);
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setError("Choose a receipt first.");
      return;
    }

    if (isProcessableReceiptImage(file)) {
      setError(labels.receipts.reviewImageFirst);
      return;
    }

    await uploadAndScan(file);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <label
        className={`grid min-h-44 cursor-pointer place-items-center rounded-lg border border-dashed p-6 text-center transition ${
          isDragging ? "border-primary bg-primary/5" : "bg-background"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          selectFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          className="sr-only"
          type="file"
          accept={acceptedMimeTypes.join(",")}
          onChange={(event) => selectFile(event.target.files?.[0])}
        />
        <span className="grid justify-items-center gap-3">
          <UploadCloud className="h-9 w-9 text-primary" />
          <span className="font-medium">{fileLabel}</span>
          <span className="text-sm text-muted-foreground">
            {labels.receipts.uploadHelper}
          </span>
        </span>
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Property">
          <select
            className={selectClassName}
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
          >
            <option value="">{labels.common.noProperty}</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={labels.receipts.scanMode}>
          <select
            className={selectClassName}
            value={scanMode}
            onChange={(event) =>
              setScanMode(event.target.value as "standard" | "plus" | "pro")
            }
          >
            <option value="standard">{labels.receipts.standardScan}</option>
            <option value="plus">{labels.receipts.plusScan}</option>
            <option value="pro">{labels.receipts.proScan}</option>
          </select>
          <p className="text-xs text-muted-foreground">
            {scanMode === "standard"
              ? labels.receipts.standardDescription
              : scanMode === "plus"
                ? labels.receipts.plusDescription
                : labels.receipts.proDescription}
          </p>
        </Field>
      </div>

      {file && isProcessableReceiptImage(file) ? (
        <ReceiptImagePreprocessStep
          file={file}
          onConfirm={(confirmedFile) => uploadAndScan(confirmedFile)}
          onUseOriginal={() => uploadAndScan(file)}
          onChooseAnother={chooseAnotherFile}
          isPending={isPending}
          labels={{
            ...labels.receipts,
            cancel: labels.common.cancel
          }}
        />
      ) : null}

      {error ? (
        <div className="space-y-3">
          <FailureState
            variant="inline"
            title="Could not scan receipt"
            description={error}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {needsAiConsent ? (
              <Button asChild size="sm">
                <Link href="/app/settings">Open AI processing settings</Link>
              </Button>
            ) : null}
            <Button asChild variant="outline" size="sm">
              <Link href="/app/expenses/new">Add expense manually</Link>
            </Button>
          </div>
        </div>
      ) : null}
      {isPending ? (
        <LoadingState
          variant="card"
          label={labels.receipts.uploadingAndScanning}
          description="Uploading the receipt, reading the file and preparing receipt review."
        />
      ) : null}
      {!file || !isProcessableReceiptImage(file) ? (
        <Button type="submit" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isPending
            ? labels.receipts.uploadingAndScanning
            : labels.receipts.uploadAndScan}
        </Button>
      ) : null}
    </form>
  );
}
