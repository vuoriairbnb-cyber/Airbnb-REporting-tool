"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Building2, Loader2, Upload, X } from "lucide-react";
import { FailureState } from "@/components/state/FailureState";
import { Button } from "@/components/ui/button";
import { Field, inputClassName, selectClassName } from "@/components/forms/Field";
import { parseApiError } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";
import type { PropertyRow } from "@/server/reporting/types";

const propertyImageBucket = "property-images";
const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxImageSizeBytes = 5 * 1024 * 1024;

function getImageExtension(file: File) {
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";
  return "jpg";
}

function makePropertyImagePath(userId: string, file: File) {
  const extension = getImageExtension(file);
  return `${userId}/properties/${crypto.randomUUID()}.${extension}`;
}

export function PropertyForm({
  property,
  initialImageUrl
}: {
  property?: PropertyRow;
  initialImageUrl?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(property?.image_path ?? null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialImageUrl ?? null
  );

  useEffect(() => {
    if (!selectedImage) return;

    const objectUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setError("Please choose a JPG, PNG or WEBP image.");
      event.target.value = "";
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setError("Property image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setError(null);
    setSelectedImage(file);
  }

  function removeImage() {
    setSelectedImage(null);
    setImagePath(null);
    setImagePreviewUrl(null);
  }

  async function uploadSelectedImage() {
    if (!selectedImage) return imagePath;

    const supabase = createClient();
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Authentication required before uploading a property image.");
    }

    const uploadPath = makePropertyImagePath(user.id, selectedImage);
    const { error: uploadError } = await supabase.storage
      .from(propertyImageBucket)
      .upload(uploadPath, selectedImage, {
        contentType: selectedImage.type,
        upsert: false
      });

    if (uploadError) {
      throw new Error(uploadError.message || "Could not upload property image.");
    }

    return uploadPath;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);

    const formData = new FormData(event.currentTarget);
    let uploadedImagePath: string | null = null;

    try {
      uploadedImagePath = await uploadSelectedImage();
    } catch (uploadError) {
      setIsPending(false);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Could not upload property image."
      );
      return;
    }

    const payload = {
      name: formData.get("name"),
      address: formData.get("address"),
      city: formData.get("city"),
      country: formData.get("country"),
      currency: formData.get("currency"),
      image_path: uploadedImagePath,
      default_allocation_method: formData.get("default_allocation_method"),
      default_allocation_percentage: formData.get("default_allocation_percentage"),
      is_active: formData.get("is_active") === "on"
    };

    const response = await fetch(
      property ? `/api/properties/${property.id}` : "/api/properties",
      {
        method: property ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    setIsPending(false);

    if (!response.ok) {
      if (selectedImage && uploadedImagePath) {
        await createClient()
          .storage.from(propertyImageBucket)
          .remove([uploadedImagePath]);
      }
      setError(await parseApiError(response, "Could not save property."));
      return;
    }

    const oldImagePath = property?.image_path;
    if (oldImagePath && oldImagePath !== uploadedImagePath) {
      await createClient().storage.from(propertyImageBucket).remove([oldImagePath]);
    }

    router.push(
      `/app/properties?success=${property ? "property-updated" : "property-created"}`
    );
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
    >
      <div className="grid gap-3">
        <span className="text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
          Property image
        </span>
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl}
              alt="Selected property"
              className="h-48 w-full object-cover"
            />
          ) : (
            <div className="grid h-48 place-items-center bg-gradient-to-br from-primary/15 via-accent to-warm/10">
              <div className="text-center">
                <Building2 className="mx-auto h-10 w-10 text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Add a photo for this property card
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" asChild>
            <label className="cursor-pointer">
              <Upload className="h-4 w-4" />
              Choose image
              <input
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
            </label>
          </Button>
          {imagePreviewUrl ? (
            <Button type="button" variant="ghost" onClick={removeImage}>
              <X className="h-4 w-4" />
              Remove image
            </Button>
          ) : null}
        </div>
        <p className="text-xs text-muted-foreground">
          JPG, PNG or WEBP. Images are stored privately and shown with signed URLs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Property name">
          <input
            className={inputClassName}
            name="name"
            defaultValue={property?.name}
            required
          />
        </Field>
        <Field label="Country">
          <input
            className={inputClassName}
            name="country"
            defaultValue={property?.country ?? "FI"}
            required
          />
        </Field>
        <Field label="Address">
          <input
            className={inputClassName}
            name="address"
            defaultValue={property?.address ?? ""}
          />
        </Field>
        <Field label="City">
          <input
            className={inputClassName}
            name="city"
            defaultValue={property?.city ?? ""}
          />
        </Field>
        <Field label="Currency">
          <input
            className={inputClassName}
            name="currency"
            defaultValue={property?.currency ?? "EUR"}
            maxLength={3}
            required
          />
        </Field>
        <Field label="Default allocation method">
          <select
            className={selectClassName}
            name="default_allocation_method"
            defaultValue={property?.default_allocation_method ?? "full_rental_use"}
          >
            <option value="full_rental_use">Full rental use</option>
            <option value="manual_percentage">Manual percentage</option>
            <option value="excluded">Excluded</option>
          </select>
        </Field>
        <Field label="Default allocation %">
          <input
            className={inputClassName}
            type="number"
            name="default_allocation_percentage"
            min="0"
            max="100"
            step="0.01"
            defaultValue={property?.default_allocation_percentage ?? 100}
          />
        </Field>
        <label className="flex items-center gap-2 self-end text-sm">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={property?.is_active ?? true}
          />
          Active
        </label>
      </div>
      {error ? (
        <FailureState
          variant="inline"
          title="Could not save property"
          description={error}
        />
      ) : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isPending ? "Saving..." : property ? "Save property" : "Create property"}
      </Button>
    </form>
  );
}
