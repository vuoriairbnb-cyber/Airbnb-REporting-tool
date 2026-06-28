export type PreprocessingStatus = "cropped" | "original" | "failed";

export type CropPercent = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export type PreprocessingResult = {
  status: PreprocessingStatus;
  originalFile: File;
  processedFile?: File;
  originalPreviewUrl: string;
  processedPreviewUrl?: string;
  originalFileSize: number;
  processedFileSize?: number;
  processedWidth?: number;
  processedHeight?: number;
  cropConfidence?: number;
  preprocessingMethod: string;
  preprocessingVersion: string;
  cropPercent?: CropPercent;
  errorMessage?: string;
};

const PROCESSABLE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PREPROCESSING_VERSION = "receipt-image-preprocessing-v1";
const MAX_DIMENSION = 2000;
const WORKING_MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.84;
const MIN_MANUAL_WIDTH_PERCENT = 30;
const MIN_MANUAL_HEIGHT_PERCENT = 45;

export function isProcessableReceiptImage(file: File) {
  return PROCESSABLE_IMAGE_TYPES.includes(file.type);
}

export function cleanupPreviewUrl(url?: string | null) {
  if (url) URL.revokeObjectURL(url);
}

export function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load receipt image."));
    };
    image.src = url;
  });
}

function getScaledSize(width: number, height: number, maxDimension: number) {
  const scale = Math.min(1, maxDimension / Math.max(width, height));

  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale))
  };
}

export function resizeImageToCanvas(
  image: HTMLImageElement,
  maxDimension = MAX_DIMENSION
) {
  const size = getScaledSize(image.naturalWidth, image.naturalHeight, maxDimension);
  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Canvas is not available.");

  context.drawImage(image, 0, 0, size.width, size.height);

  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Could not optimize receipt image."));
          return;
        }

        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function compressCanvasToBlob(
  canvas: HTMLCanvasElement,
  quality = JPEG_QUALITY
) {
  return canvasToBlob(canvas, "image/jpeg", quality);
}

function createProcessedFile(originalFile: File, blob: Blob, suffix: string) {
  const baseName = originalFile.name.replace(/\.[^.]+$/, "");

  return new File([blob], `${baseName}-${suffix}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now()
  });
}

function cropCanvas(source: HTMLCanvasElement, crop: CropPercent) {
  const left = Math.round(source.width * (crop.left / 100));
  const top = Math.round(source.height * (crop.top / 100));
  const right = Math.round(source.width * (crop.right / 100));
  const bottom = Math.round(source.height * (crop.bottom / 100));
  const width = Math.max(1, source.width - left - right);
  const height = Math.max(1, source.height - top - bottom);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context) throw new Error("Canvas is not available.");

  context.drawImage(source, left, top, width, height, 0, 0, width, height);

  return canvas;
}

function luminance(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getRemainingCropArea(crop: CropPercent) {
  return {
    width: Math.max(0, 100 - crop.left - crop.right),
    height: Math.max(0, 100 - crop.top - crop.bottom)
  };
}

export function isSafeManualCrop(crop: CropPercent) {
  const area = getRemainingCropArea(crop);

  return (
    area.width >= MIN_MANUAL_WIDTH_PERCENT && area.height >= MIN_MANUAL_HEIGHT_PERCENT
  );
}

function expandCrop(crop: CropPercent, minimumWidth: number, minimumHeight: number) {
  const next = { ...crop };
  const width = 100 - next.left - next.right;
  const height = 100 - next.top - next.bottom;

  if (width < minimumWidth) {
    const needed = minimumWidth - width;
    next.left = Math.max(0, next.left - Math.ceil(needed / 2));
    next.right = Math.max(0, next.right - Math.floor(needed / 2));
  }

  if (height < minimumHeight) {
    const needed = minimumHeight - height;
    next.top = Math.max(0, next.top - Math.ceil(needed / 2));
    next.bottom = Math.max(0, next.bottom - Math.floor(needed / 2));
  }

  return next;
}

function detectReceiptCrop(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  const { width, height } = canvas;
  const data = context.getImageData(0, 0, width, height).data;
  const step = Math.max(2, Math.floor(Math.max(width, height) / 450));
  let paperMinX = width;
  let paperMinY = height;
  let paperMaxX = 0;
  let paperMaxY = 0;
  let paperMarked = 0;
  let contentMinX = width;
  let contentMinY = height;
  let contentMaxX = 0;
  let contentMaxY = 0;
  let contentMarked = 0;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const index = (y * width + x) * 4;
      const r = data[index] ?? 255;
      const g = data[index + 1] ?? 255;
      const b = data[index + 2] ?? 255;
      const maxChannel = Math.max(r, g, b);
      const minChannel = Math.min(r, g, b);
      const colorSpread = maxChannel - minChannel;
      const lightness = luminance(r, g, b);
      const isLikelyPaper = lightness > 142 && colorSpread < 74;
      const isLikelyContent = lightness < 242 || colorSpread > 26;

      if (isLikelyPaper) {
        paperMinX = Math.min(paperMinX, x);
        paperMinY = Math.min(paperMinY, y);
        paperMaxX = Math.max(paperMaxX, x);
        paperMaxY = Math.max(paperMaxY, y);
        paperMarked += 1;
      }

      if (isLikelyContent) {
        contentMinX = Math.min(contentMinX, x);
        contentMinY = Math.min(contentMinY, y);
        contentMaxX = Math.max(contentMaxX, x);
        contentMaxY = Math.max(contentMaxY, y);
        contentMarked += 1;
      }
    }
  }

  const usePaperBounds = paperMarked > 24;
  let minX = usePaperBounds ? paperMinX : contentMinX;
  let minY = usePaperBounds ? paperMinY : contentMinY;
  let maxX = usePaperBounds ? paperMaxX : contentMaxX;
  let maxY = usePaperBounds ? paperMaxY : contentMaxY;

  if (!(usePaperBounds ? paperMarked : contentMarked)) return null;

  const padding = Math.round(Math.min(width, height) * (usePaperBounds ? 0.08 : 0.045));
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width, maxX + padding);
  maxY = Math.min(height, maxY + padding);

  const cropWidth = maxX - minX;
  const cropHeight = maxY - minY;
  const areaRatio = (cropWidth * cropHeight) / (width * height);
  const marginRatio = (minX + minY + (width - maxX) + (height - maxY)) / (width + height);
  const confidence = Math.max(
    0,
    Math.min(
      0.92,
      (usePaperBounds ? 0.52 : 0.35) + marginRatio * 1.2 + (areaRatio > 0.08 ? 0.1 : 0)
    )
  );

  if (areaRatio < 0.035 || areaRatio > 0.98 || confidence < 0.48) return null;

  return {
    cropPercent: expandCrop(
      {
        left: Math.round((minX / width) * 100),
        top: Math.round((minY / height) * 100),
        right: Math.round(((width - maxX) / width) * 100),
        bottom: Math.round(((height - maxY) / height) * 100)
      },
      MIN_MANUAL_WIDTH_PERCENT,
      MIN_MANUAL_HEIGHT_PERCENT
    ),
    confidence
  };
}

export async function createOriginalPreview(file: File): Promise<PreprocessingResult> {
  return {
    status: "original",
    originalFile: file,
    originalPreviewUrl: URL.createObjectURL(file),
    originalFileSize: file.size,
    preprocessingMethod: "original",
    preprocessingVersion: PREPROCESSING_VERSION
  };
}

export async function applyManualCrop(
  file: File,
  cropPercent: CropPercent
): Promise<PreprocessingResult> {
  if (!isSafeManualCrop(cropPercent)) {
    throw new Error("The crop area is too small. Keep more of the receipt visible.");
  }

  const image = await loadImageFromFile(file);
  const resizedCanvas = resizeImageToCanvas(image, MAX_DIMENSION);
  const croppedCanvas = cropCanvas(resizedCanvas, cropPercent);
  const blob = await compressCanvasToBlob(croppedCanvas);
  const processedFile =
    blob.size < file.size ? createProcessedFile(file, blob, "crop") : file;

  return {
    status: processedFile === file ? "original" : "cropped",
    originalFile: file,
    processedFile: processedFile === file ? undefined : processedFile,
    originalPreviewUrl: URL.createObjectURL(file),
    processedPreviewUrl:
      processedFile === file
        ? URL.createObjectURL(file)
        : URL.createObjectURL(processedFile),
    originalFileSize: file.size,
    processedFileSize: processedFile.size,
    processedWidth: croppedCanvas.width,
    processedHeight: croppedCanvas.height,
    cropConfidence: 1,
    preprocessingMethod: "manual-rectangular-crop",
    preprocessingVersion: PREPROCESSING_VERSION,
    cropPercent
  };
}

export async function attemptAutoCropReceipt(file: File): Promise<PreprocessingResult> {
  const originalPreviewUrl = URL.createObjectURL(file);

  try {
    const image = await loadImageFromFile(file);
    const workingCanvas = resizeImageToCanvas(image, WORKING_MAX_DIMENSION);
    const detection = detectReceiptCrop(workingCanvas);
    const resizedCanvas = resizeImageToCanvas(image, MAX_DIMENSION);

    if (!detection) {
      const blob = await compressCanvasToBlob(resizedCanvas);
      const processedFile =
        blob.size < file.size ? createProcessedFile(file, blob, "optimized") : file;

      return {
        status: "failed",
        originalFile: file,
        processedFile: processedFile === file ? undefined : processedFile,
        originalPreviewUrl,
        processedPreviewUrl:
          processedFile === file
            ? URL.createObjectURL(file)
            : URL.createObjectURL(processedFile),
        originalFileSize: file.size,
        processedFileSize: processedFile.size,
        processedWidth: resizedCanvas.width,
        processedHeight: resizedCanvas.height,
        preprocessingMethod:
          processedFile === file ? "auto-crop-failed-original" : "resize-compress",
        preprocessingVersion: PREPROCESSING_VERSION,
        errorMessage: "Receipt edges were not detected with enough confidence."
      };
    }

    const croppedCanvas = cropCanvas(resizedCanvas, detection.cropPercent);
    const blob = await compressCanvasToBlob(croppedCanvas);
    const processedFile =
      blob.size < file.size ? createProcessedFile(file, blob, "cropped") : file;

    return {
      status: processedFile === file ? "original" : "cropped",
      originalFile: file,
      processedFile: processedFile === file ? undefined : processedFile,
      originalPreviewUrl,
      processedPreviewUrl:
        processedFile === file
          ? URL.createObjectURL(file)
          : URL.createObjectURL(processedFile),
      originalFileSize: file.size,
      processedFileSize: processedFile.size,
      processedWidth: croppedCanvas.width,
      processedHeight: croppedCanvas.height,
      cropConfidence: detection.confidence,
      preprocessingMethod: processedFile === file ? "auto-crop-original" : "auto-crop",
      preprocessingVersion: PREPROCESSING_VERSION,
      cropPercent: detection.cropPercent
    };
  } catch (error) {
    return {
      status: "failed",
      originalFile: file,
      originalPreviewUrl,
      originalFileSize: file.size,
      preprocessingMethod: "preprocessing-failed",
      preprocessingVersion: PREPROCESSING_VERSION,
      errorMessage:
        error instanceof Error ? error.message : "Receipt image preprocessing failed."
    };
  }
}
