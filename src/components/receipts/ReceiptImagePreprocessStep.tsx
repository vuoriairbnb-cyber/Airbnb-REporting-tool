"use client";

import { useEffect, useState } from "react";
import { Crop, ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  applyManualCrop,
  attemptAutoCropReceipt,
  cleanupPreviewUrl,
  type CropPercent,
  type PreprocessingResult
} from "@/lib/receipts/image-preprocessing";

function formatFileSize(bytes?: number) {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function PreviewImage({
  src,
  alt,
  crop
}: {
  src: string;
  alt: string;
  crop?: CropPercent;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="max-h-[520px] w-full object-contain" />
      {crop ? (
        <div
          className="pointer-events-none absolute border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]"
          style={{
            left: `${crop.left}%`,
            top: `${crop.top}%`,
            right: `${crop.right}%`,
            bottom: `${crop.bottom}%`
          }}
        />
      ) : null}
    </div>
  );
}

export function ReceiptImagePreprocessStep({
  file,
  onConfirm,
  onUseOriginal,
  onChooseAnother,
  isPending = false
}: {
  file: File;
  onConfirm: (file: File, result: PreprocessingResult) => void;
  onUseOriginal: () => void;
  onChooseAnother: () => void;
  isPending?: boolean;
}) {
  const [result, setResult] = useState<PreprocessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [isApplyingManual, setIsApplyingManual] = useState(false);
  const [manualCrop, setManualCrop] = useState<CropPercent>({
    left: 6,
    top: 6,
    right: 6,
    bottom: 6
  });

  useEffect(() => {
    let cancelled = false;
    setIsPreparing(true);
    setError(null);
    setResult(null);
    setIsManual(false);

    attemptAutoCropReceipt(file)
      .then((nextResult) => {
        if (!cancelled) setResult(nextResult);
      })
      .catch(() => {
        if (!cancelled) {
          setError("We could not prepare the image. You can still scan the original.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreparing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl(result?.originalPreviewUrl);
      cleanupPreviewUrl(result?.processedPreviewUrl);
    };
  }, [result]);

  async function applyCrop() {
    setIsApplyingManual(true);
    setError(null);

    try {
      const nextResult = await applyManualCrop(file, manualCrop);
      setResult(nextResult);
      setIsManual(false);
    } catch {
      setError("Manual crop could not be applied. You can still scan the original.");
    } finally {
      setIsApplyingManual(false);
    }
  }

  const previewUrl = result?.processedPreviewUrl ?? result?.originalPreviewUrl;
  const confirmedFile = result?.processedFile ?? file;
  const hasCroppedPreview = result?.status === "cropped" && result.processedPreviewUrl;

  if (isPreparing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="grid min-h-64 place-items-center text-center">
          <div>
            <Sparkles className="mx-auto h-9 w-9 animate-pulse text-primary" />
            <p className="mt-4 font-display text-xl">Preparing receipt image...</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Image optimization can reduce upload size and improve AI extraction quality.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-xl">
            {hasCroppedPreview
              ? "We found the receipt area"
              : "We could not detect the receipt edges"}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {hasCroppedPreview
              ? "We found the receipt area. Review before scanning."
              : "We could not detect the receipt edges. You can still scan the original image."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Optimizing the receipt image can improve extraction quality and reduce upload
            size.
          </p>
        </div>
        <div className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {result?.preprocessingMethod ?? "image preview"}
        </div>
      </div>

      {previewUrl ? (
        <PreviewImage
          src={isManual ? (result?.originalPreviewUrl ?? previewUrl) : previewUrl}
          alt="Receipt crop preview"
          crop={isManual ? manualCrop : undefined}
        />
      ) : (
        <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-border bg-surface text-center">
          <div>
            <ImageIcon className="mx-auto h-9 w-9 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Preview unavailable</p>
          </div>
        </div>
      )}

      {isManual ? (
        <div className="rounded-xl border border-border bg-surface/70 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {(["left", "right", "top", "bottom"] as const).map((side) => (
              <label key={side} className="grid gap-2 text-sm font-medium">
                {side[0].toUpperCase()}
                {side.slice(1)} crop: {manualCrop[side]}%
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={manualCrop[side]}
                  onChange={(event) =>
                    setManualCrop((current) => ({
                      ...current,
                      [side]: Number(event.target.value)
                    }))
                  }
                />
              </label>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={applyCrop} disabled={isApplyingManual}>
              <Crop className="h-4 w-4" />
              {isApplyingManual ? "Applying..." : "Apply crop"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsManual(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span>Original: {formatFileSize(result?.originalFileSize ?? file.size)}</span>
        {result?.processedFileSize ? (
          <span>Optimized: {formatFileSize(result.processedFileSize)}</span>
        ) : null}
        {result?.cropConfidence ? (
          <span>Crop confidence: {Math.round(result.cropConfidence * 100)}%</span>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {hasCroppedPreview ? (
          <Button
            type="button"
            disabled={isPending}
            onClick={() => result && onConfirm(confirmedFile, result)}
          >
            {isPending ? "Uploading and scanning..." : "Looks good - continue"}
          </Button>
        ) : (
          <Button type="button" disabled={isPending} onClick={onUseOriginal}>
            {isPending ? "Uploading and scanning..." : "Scan original"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setManualCrop(result?.cropPercent ?? manualCrop);
            setIsManual(true);
          }}
        >
          Adjust crop
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onUseOriginal}
        >
          Use original
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onChooseAnother}
        >
          <RotateCcw className="h-4 w-4" />
          Choose another image
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        You can always scan the original image if preprocessing does not look right.
      </p>
    </div>
  );
}
