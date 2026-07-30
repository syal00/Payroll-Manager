"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Link2, Loader2, Upload, X } from "lucide-react";
import { isDisplayableLogoUrl, isValidCompanyLogoUrl } from "@/lib/company-logo-url";

type LogoMode = "url" | "upload";

function LogoPreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!isDisplayableLogoUrl(url)) return null;

  return (
    <div className="mt-2 flex items-center gap-3">
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url.trim()}
          alt="Logo preview"
          width={48}
          height={48}
          className="h-12 w-12 rounded-lg border border-[var(--sa-border)] object-contain bg-[var(--sa-surface-raised)]"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-lg border border-[var(--sa-border)] bg-[var(--sa-surface-raised)] text-xs text-[var(--sa-muted)]">
          N/A
        </span>
      )}
      <span className="text-xs text-[var(--sa-muted)]">
        {failed ? "Could not load this logo." : "Logo preview"}
      </span>
    </div>
  );
}

export function CompanyLogoField({
  value,
  onChange,
  inputId = "co-logo",
}: {
  value: string;
  onChange: (url: string) => void;
  inputId?: string;
}) {
  const uploadInputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<LogoMode>("url");
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const urlError =
    value.trim() && !isValidCompanyLogoUrl(value)
      ? "Enter a valid http:// or https:// URL, or upload an image file."
      : null;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadErr(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/super-admin/upload/logo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadErr(data.error ?? "Upload failed");
        return;
      }
      onChange(data.logoUrl as string);
      setMode("upload");
    } catch {
      setUploadErr("Network error during upload");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-2">
        <button
          type="button"
          className={`sa-logo-mode-btn ${mode === "url" ? "is-active" : ""}`}
          onClick={() => setMode("url")}
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
          URL
        </button>
        <button
          type="button"
          className={`sa-logo-mode-btn ${mode === "upload" ? "is-active" : ""}`}
          onClick={() => setMode("upload")}
        >
          <Upload className="h-3.5 w-3.5" aria-hidden />
          Upload file
        </button>
      </div>

      {mode === "url" ? (
        <input
          id={inputId}
          className="sa-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
        />
      ) : (
        <div className="space-y-2">
          <input
            ref={fileRef}
            id={uploadInputId}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={(e) => void handleFileChange(e)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="sa-btn-ghost"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="h-4 w-4" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Choose image"}
            </button>
            {value ? (
              <button
                type="button"
                className="sa-btn-ghost sa-btn-danger"
                disabled={uploading}
                onClick={() => onChange("")}
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-xs text-[var(--sa-muted)]">PNG, JPEG, WebP, or SVG · max 2 MB</p>
          {value && isDisplayableLogoUrl(value) ? (
            <p className="sa-mono text-xs text-[var(--sa-accent)]">{value}</p>
          ) : null}
        </div>
      )}

      {urlError && mode === "url" ? <p className="sa-hint-error mt-1 text-xs">{urlError}</p> : null}
      {uploadErr ? <p className="sa-hint-error mt-1 text-xs">{uploadErr}</p> : null}
      {value ? <LogoPreview url={value} /> : null}
    </div>
  );
}
