"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_BYTES = 12 * 1024 * 1024; // 12MB — also enforced server-side (§10)

/** Source-photo upload with client-side type/size validation + preview (§10). */
export function UploadDropzone({
  value,
  onChange,
  label = "Upload a photo",
  hint = "JPG, PNG or WebP · up to 12MB",
  className,
}: {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  hint?: string;
  className?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const onDrop = useCallback(
    (accepted: File[]) => {
      const f = accepted[0];
      if (f) onChange(f);
    },
    [onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [] },
    maxSize: MAX_BYTES,
    multiple: false,
    onDropRejected: () => toast.error("Use a JPG, PNG or WebP under 12MB."),
  });

  if (value && preview) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-card border border-hairline bg-surface-2",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="Your upload" className="max-h-[420px] w-full object-contain" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Remove photo"
          className="glass absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-pill text-hi transition-transform hover:scale-105"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-14 text-center transition-colors duration-base",
        isDragActive
          ? "border-cyan bg-cyan/5"
          : "border-hairline bg-surface-2/50 hover:border-cyan/50 hover:bg-surface-2",
        className,
      )}
    >
      <input {...getInputProps()} />
      <span className="grid h-12 w-12 place-items-center rounded-pill bg-grad-electric text-on-electric shadow-glow">
        <ImageUp className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-hi">{label}</p>
        <p className="text-caption text-mid">{isDragActive ? "Drop to upload" : hint}</p>
      </div>
    </div>
  );
}
