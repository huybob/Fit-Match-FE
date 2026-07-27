"use client";

import { useRef, useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { fileService, resolveFileUrl, type UploadFolder } from "@/services/file.service";
import { useToast } from "@/lib/toast-provider";
import { toErrorMessage } from "@/shared/utils/error.util";
import { useTranslations } from "next-intl";
import { Button } from "@/shared/components/ui/button";

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp|svg|avif)(\?|$)/i;

function fileNameOf(url: string) {
  try {
    const clean = url.split("?")[0];
    return decodeURIComponent(clean.substring(clean.lastIndexOf("/") + 1)) || "Tệp đã tải lên";
  } catch {
    return null;
  }
}

function extOf(nameOrUrl: string) {
  const clean = nameOrUrl.split("?")[0];
  const dot = clean.lastIndexOf(".");
  const ext = dot >= 0 ? clean.slice(dot + 1) : "";
  return ext ? ext.toUpperCase().slice(0, 4) : "FILE";
}

export function FileUpload({
  value,
  onChange,
  folder = "documents",
  label,
  accept = "image/*,application/pdf",
  disabled = false,
  className = "",
}: {
  value?: string;
  onChange: (url: string) => void;
  folder?: UploadFolder;
  label?: string;
  accept?: string;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  // Local preview + name for the file picked in this session (survives auth-only download endpoints).
  const [preview, setPreview] = useState("");
  const [localName, setLocalName] = useState("");
  const { toast } = useToast();

  async function handleFile(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const res = await fileService.upload(file, folder);
      onChange(res.url);
      setLocalName(file.name);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(file.type.startsWith("image/") ? URL.createObjectURL(file) : "");
    } catch (e) {
      toast({ type: "error", title: "Tải lên thất bại", description: toErrorMessage(e) });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    setLocalName("");
    onChange("");
  }

  const displayName = localName || fileNameOf(value ?? "");
  const isImage = !!preview || (!!value && IMAGE_RE.test(value));
  const imgSrc = preview || resolveFileUrl(value);

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={label ?? t("upload.label")}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {value ? (
        <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgSrc}
              alt="preview"
              className="size-11 rounded-lg object-cover border border-border shrink-0 bg-muted/40"
            />
          ) : (
            <div className="size-11 rounded-lg bg-primary/10 border border-primary/20 flex flex-col items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-primary leading-none">{extOf(displayName ?? "")}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-success">{t("upload.done")}</p>
            <p className="text-[11px] text-muted-foreground truncate">{displayName}</p>
          </div>
          {!disabled && (
            <div className="flex items-center gap-2.5 shrink-0">
              <Button variant="link" size="inline"
 type="button"
 onClick={() => inputRef.current?.click()}
 disabled={uploading}
 className="text-[11px] text-primary disabled:opacity-50"
>
                {uploading ? t("upload.loading") : t("upload.replace")}
              </Button>
              <Button variant="link" size="inline"
 type="button"
 onClick={clear}
 className="text-[11px] text-destructive"
>{t("common.actions.delete")}</Button>
            </div>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-muted-foreground hover:border-primary hover:text-primary"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" /> {t("upload.uploading")}
            </>
          ) : (
            <>
              <UploadCloud className="size-3.5" /> {label ?? t("upload.label")}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
