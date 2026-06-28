"use client";

import { useEffect, useState } from "react";
import { Crop, ImageIcon, RotateCcw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dictionary } from "@/lib/i18n";
import {
  applyManualCrop,
  attemptAutoCropReceipt,
  cleanupPreviewUrl,
  getRemainingCropArea,
  isSafeManualCrop,
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
  isPending = false,
  labels
}: {
  file: File;
  onConfirm: (file: File, result: PreprocessingResult) => void;
  onUseOriginal: () => void;
  onChooseAnother: () => void;
  isPending?: boolean;
  labels: Dictionary["receipts"] & { cancel: string };
}) {
  const [result, setResult] = useState<PreprocessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPreparing, setIsPreparing] = useState(true);
  const [isManual, setIsManual] = useState(false);
  const [isApplyingManual, setIsApplyingManual] = useState(false);
  const [manualCrop, setManualCrop] = useState<CropPercent>({
    left: 0,
    top: 0,
    right: 0,
    bottom: 0
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
          setError(labels.prepareError);
        }
      })
      .finally(() => {
        if (!cancelled) setIsPreparing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [file, labels.prepareError]);

  useEffect(() => {
    return () => {
      cleanupPreviewUrl(result?.originalPreviewUrl);
      cleanupPreviewUrl(result?.processedPreviewUrl);
    };
  }, [result]);

  async function applyCrop() {
    if (!isSafeManualCrop(manualCrop)) {
      setError(labels.cropTooTight);
      return;
    }

    setIsApplyingManual(true);
    setError(null);

    try {
      const nextResult = await applyManualCrop(file, manualCrop);
      setResult(nextResult);
      setIsManual(false);
    } catch {
      setError(labels.manualCropError);
    } finally {
      setIsApplyingManual(false);
    }
  }

  const previewUrl = result?.processedPreviewUrl ?? result?.originalPreviewUrl;
  const confirmedFile = result?.processedFile ?? file;
  const hasCroppedPreview = result?.status === "cropped" && result.processedPreviewUrl;
  const remainingCropArea = getRemainingCropArea(manualCrop);
  const manualCropIsSafe = isSafeManualCrop(manualCrop);

  if (isPreparing) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="grid min-h-64 place-items-center text-center">
          <div>
            <Sparkles className="mx-auto h-9 w-9 animate-pulse text-primary" />
            <p className="mt-4 font-display text-xl">{labels.preparingImage}</p>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              {labels.imageOptimization}
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
            {hasCroppedPreview ? labels.foundArea : labels.couldNotDetect}
          </p>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
            {hasCroppedPreview ? labels.foundAreaBody : labels.couldNotDetectBody}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{labels.imageOptimization}</p>
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
                {labels.removeFrom} {side}: {manualCrop[side]}%
                <input
                  type="range"
                  min="0"
                  max={side === "left" || side === "right" ? "35" : "28"}
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
          <div className="mt-3 rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
            Crop keeps about {Math.round(remainingCropArea.width)}% width and{" "}
            {Math.round(remainingCropArea.height)}% height. Keep the full receipt inside
            the green box.
            {!manualCropIsSafe ? (
              <p className="mt-1 text-destructive">{labels.cropTooTight}</p>
            ) : null}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={applyCrop}
              disabled={isApplyingManual || !manualCropIsSafe}
            >
              <Crop className="h-4 w-4" />
              {isApplyingManual ? labels.applying : labels.applyCrop}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setManualCrop({ left: 0, top: 0, right: 0, bottom: 0 })}
            >
              {labels.resetCrop}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsManual(false)}>
              {labels.cancel}
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
            {isPending ? labels.uploadingAndScanning : labels.looksGood}
          </Button>
        ) : (
          <Button type="button" disabled={isPending} onClick={onUseOriginal}>
            {isPending ? labels.uploadingAndScanning : labels.scanOriginal}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => {
            setManualCrop(
              result?.cropPercent ?? { left: 0, top: 0, right: 0, bottom: 0 }
            );
            setIsManual(true);
          }}
        >
          {labels.adjustCrop}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={onUseOriginal}
        >
          {labels.useOriginal}
        </Button>
        <Button
          type="button"
          variant="ghost"
          disabled={isPending}
          onClick={onChooseAnother}
        >
          <RotateCcw className="h-4 w-4" />
          {labels.chooseAnotherImage}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">{labels.originalFallback}</p>
    </div>
  );
}
