"use client";

import { ImagePlus, Loader2, RotateCcw, Star, X } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/lib/toast-provider";
import { mediaService, MEDIA_LIMITS } from "@/services/media.service";
import type { Media, MediaEntityType, MediaImageType } from "@/types/Media";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/utils/cn.util";
import { toErrorMessage } from "@/shared/utils/error.util";
import { SmartImage } from "./smart-image";

/** Một file đang trong hàng đợi upload — giữ lại File để bấm "Thử lại" được. */
interface PendingUpload {
  key: string;
  file: File;
  previewUrl: string;
  progress: number;
  error?: string;
}

let pendingCounter = 0;

/**
 * Loại ảnh chỉ giữ ĐÚNG MỘT tấm cho mỗi entity (khớp `MediaImageType.singleton`
 * của BE). Upload tấm mới = THAY tấm cũ, BE tự xoá ảnh cũ cả ở DB lẫn storage —
 * nên ô chọn không được coi "đã có 1 ảnh" là "đã hết chỗ" và chặn nút.
 */
const SINGLETON_IMAGE_TYPES: MediaImageType[] = ["AVATAR", "COVER", "THUMBNAIL"];

/**
 * Ô chọn & upload ảnh dùng chung cho MỌI màn hình (avatar, thư viện gym/chi
 * nhánh, ảnh dịch vụ/gói, ảnh check-in, ảnh đánh giá). Không màn hình nào tự
 * viết lại logic upload — đó là lý do component này nhận `entityType`/`imageType`
 * thay vì hard-code đường dẫn.
 *
 * `entityId` bỏ trống = chế độ nháp: ảnh lên GCS ngay nhưng chưa gắn vào bản ghi
 * nào; màn hình gọi API tạo (vd tạo đánh giá) rồi gửi kèm danh sách id.
 */
export function ImageUploader({
  entityType,
  entityId,
  imageType,
  value,
  onChange,
  onRemove,
  onSetPrimary,
  uploadFn,
  max = MEDIA_LIMITS.maxFiles,
  maxSizeMb = MEDIA_LIMITS.maxSizeMb,
  multiple = true,
  disabled = false,
  label,
  className,
}: {
  entityType: MediaEntityType;
  entityId?: number | null;
  imageType: MediaImageType;
  value: Media[];
  onChange: (media: Media[]) => void;
  /**
   * Gọi khi người dùng bấm xoá một ảnh ĐÃ upload. Bỏ trống = chỉ gỡ khỏi danh
   * sách phía client (dùng cho form nháp — bản ghi chưa lưu thì chưa cần xoá
   * thật, job dọn rác của BE lo phần còn lại).
   */
  onRemove?: (media: Media) => Promise<void> | void;
  onSetPrimary?: (media: Media) => Promise<void> | void;
  /**
   * Ghi đè lời gọi upload cho các endpoint chuyên biệt vẫn đi qua Media system ở
   * BE (vd `/gym/media` tự suy ra gym từ token nên FE không cần biết gymProfileId).
   * Toàn bộ phần còn lại — kiểm tra file, tiến trình, thử lại — vẫn dùng chung.
   */
  uploadFn?: (files: File[], onProgress: (percent: number) => void) => Promise<Media[]>;
  max?: number;
  maxSizeMb?: number;
  multiple?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingUpload[]>([]);

  const singleton = SINGLETON_IMAGE_TYPES.includes(imageType);
  // Ảnh đơn: chỗ trống KHÔNG trừ ảnh hiện có — nếu trừ thì ảnh bìa/avatar đã có
  // sẽ làm nút "Thêm ảnh" tắt vĩnh viễn và không ai đổi được ảnh nữa.
  const slotsLeft = singleton
    ? (pending.length ? 0 : 1)
    : Math.max(0, max - value.length - pending.length);
  const busy = pending.some((p) => !p.error);

  function reject(title: string, description?: string) {
    toast({ type: "error", title, description });
  }

  /** Kiểm tra phía client: nhanh, nhưng BE vẫn kiểm lại đầy đủ (kể cả magic bytes). */
  function accept(file: File): string | null {
    if (!MEDIA_LIMITS.acceptedMimeTypes.includes(file.type as never)) {
      return t("media.unsupportedType", { name: file.name });
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return t("media.tooLarge", {
        name: file.name,
        max: maxSizeMb,
        size: (file.size / 1024 / 1024).toFixed(1),
      });
    }
    // Chọn nhầm cùng một tấm hai lần là chuyện thường khi bấm "Thêm ảnh" nhiều
    // lần; báo ngay thay vì để hai ảnh giống hệt nằm cạnh nhau trong thư viện.
    // Ảnh đơn thì "trùng với ảnh đang có" là chuyện hợp lệ (chọn lại đúng tấm đó
    // để thay), chỉ chặn trùng trong hàng đợi.
    const duplicate =
      (!singleton &&
        value.some((m) => m.originalName === file.name && m.fileSize === file.size)) ||
      pending.some((p) => p.file.name === file.name && p.file.size === file.size);
    if (duplicate) return t("media.duplicate", { name: file.name });
    return null;
  }

  async function uploadOne(item: PendingUpload): Promise<Media | null> {
    try {
      const onProgress = (percent: number) =>
        setPending((list) =>
          list.map((p) => (p.key === item.key ? { ...p, progress: percent } : p)),
        );
      const [uploaded] = uploadFn
        ? await uploadFn([item.file], onProgress)
        : await mediaService.upload([item.file], { entityType, entityId, imageType }, onProgress);
      URL.revokeObjectURL(item.previewUrl);
      setPending((list) => list.filter((p) => p.key !== item.key));
      return uploaded;
    } catch (error) {
      const message = toErrorMessage(error);
      setPending((list) =>
        list.map((p) => (p.key === item.key ? { ...p, error: message, progress: 0 } : p)),
      );
      reject(t("media.uploadFailed"), message);
      return null;
    }
  }

  /**
   * Chạy cả lô rồi mới gọi `onChange` MỘT lần. Gọi onChange sau từng file sẽ đọc
   * `value` cũ trong closure (prop, không phải state) — chọn 3 ảnh cùng lúc thì
   * chỉ ảnh cuối sống sót.
   */
  async function runUploads(items: PendingUpload[], base: Media[]) {
    const results = await Promise.all(items.map((item) => uploadOne(item)));
    const uploaded = results.filter((m): m is Media => m !== null);
    if (uploaded.length) onChange([...base, ...uploaded]);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const files = Array.from(fileList);

    if (files.length > slotsLeft) {
      reject(t("media.tooMany"), t("media.tooManyHint", { max }));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const queued: PendingUpload[] = [];
    for (const file of files) {
      const problem = accept(file);
      if (problem) {
        reject(t("media.rejected"), problem);
        continue;
      }
      queued.push({
        key: `pending-${++pendingCounter}`,
        file,
        previewUrl: URL.createObjectURL(file),
        progress: 0,
      });
    }
    if (inputRef.current) inputRef.current.value = "";
    if (!queued.length) return;

    setPending((list) => [...list, ...queued]);
    // Ảnh đơn: BE thay ảnh cũ nên danh sách mới chỉ còn tấm vừa upload.
    void runUploads(queued, singleton ? [] : value);
  }

  async function remove(media: Media) {
    try {
      if (onRemove) await onRemove(media);
      onChange(value.filter((m) => m.id !== media.id));
    } catch (error) {
      reject(t("media.deleteFailed"), toErrorMessage(error));
    }
  }

  function discard(item: PendingUpload) {
    URL.revokeObjectURL(item.previewUrl);
    setPending((list) => list.filter((p) => p.key !== item.key));
  }

  function retry(item: PendingUpload) {
    setPending((list) =>
      list.map((p) => (p.key === item.key ? { ...p, error: undefined, progress: 0 } : p)),
    );
    void runUploads([{ ...item, error: undefined, progress: 0 }], singleton ? [] : value);
  }

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple && !singleton}
        accept={MEDIA_LIMITS.accept}
        aria-label={label ?? t("media.addImages")}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {(value.length > 0 || pending.length > 0) && (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {value.map((media) => (
            <li key={media.id} className="group relative overflow-hidden rounded-xl border border-border">
              <SmartImage
                src={media.thumbnailUrl || media.url}
                alt={media.caption || media.originalName || t("media.imageAlt")}
                className="aspect-square w-full bg-muted/40 object-cover"
              />
              {media.primary && (
                <span className="absolute left-1 top-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-black text-primary-foreground">
                  {t("media.primary")}
                </span>
              )}
              {!disabled && (
                <div className="absolute right-1 top-1 flex gap-1">
                  {onSetPrimary && !media.primary && (
                    <button
                      type="button"
                      aria-label={t("media.setPrimary")}
                      title={t("media.setPrimary")}
                      className="grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
                      onClick={() => void onSetPrimary(media)}
                    >
                      <Star className="size-3" />
                    </button>
                  )}
                  <button
                    type="button"
                    aria-label={t("media.removeImage")}
                    title={t("media.removeImage")}
                    className="grid size-6 place-items-center rounded-full bg-black/60 text-white hover:bg-destructive"
                    onClick={() => void remove(media)}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </li>
          ))}

          {pending.map((item) => (
            <li key={item.key} className="relative overflow-hidden rounded-xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element -- blob preview cục bộ */}
              <img
                src={item.previewUrl}
                alt={item.file.name}
                className="aspect-square w-full object-cover opacity-60"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 px-1 text-white">
                {item.error ? (
                  <>
                    <span className="text-center text-[9px] font-bold leading-tight">
                      {t("media.failed")}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        aria-label={t("common.actions.retry")}
                        className="grid size-6 place-items-center rounded-full bg-white/20 hover:bg-white/35"
                        onClick={() => retry(item)}
                      >
                        <RotateCcw className="size-3" />
                      </button>
                      <button
                        type="button"
                        aria-label={t("media.removeImage")}
                        className="grid size-6 place-items-center rounded-full bg-white/20 hover:bg-destructive"
                        onClick={() => discard(item)}
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <div className="h-1 w-4/5 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full bg-white transition-[width]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold">{item.progress}%</span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy || slotsLeft === 0}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {label ??
            (singleton && value.length > 0 ? t("media.replaceImage") : t("media.addImages"))}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {singleton
            ? t("media.hintSingle", { size: maxSizeMb })
            : t("media.hint", { max, size: maxSizeMb })}
        </span>
      </div>
    </div>
  );
}
