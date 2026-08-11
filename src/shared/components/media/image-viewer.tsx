"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import type { Media } from "@/types/Media";
import { SmartImage } from "./smart-image";

/**
 * Lightbox xem ảnh cỡ lớn. Điều hướng bằng phím mũi tên và Esc — người xem một
 * album 10 ảnh sẽ không bấm chuột 10 lần.
 */
export function ImageViewer({
  images,
  index,
  onIndexChange,
  onClose,
}: {
  images: Media[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const t = useTranslations();
  const total = images.length;

  const step = useCallback(
    (delta: number) => onIndexChange((index + delta + total) % total),
    [index, total, onIndexChange],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    // Khoá cuộn nền: cuộn trang phía sau khi lightbox mở làm mất vị trí đang đọc.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, step]);

  const current = images[index];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("media.viewerTitle")}
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="flex items-center justify-between p-4 text-white">
        <span className="text-sm font-semibold">
          {index + 1} / {total}
        </span>
        <button
          type="button"
          aria-label={t("common.actions.close")}
          className="grid size-9 place-items-center rounded-full hover:bg-white/15"
          onClick={onClose}
        >
          <X className="size-5" />
        </button>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center px-4 pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {total > 1 && (
          <button
            type="button"
            aria-label={t("media.previous")}
            className="absolute left-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
            onClick={() => step(-1)}
          >
            <ChevronLeft className="size-6" />
          </button>
        )}
        <SmartImage
          src={current.url}
          alt={current.caption || current.originalName || t("media.imageAlt")}
          loading="eager"
          className="max-h-[80vh] max-w-full rounded-lg object-contain"
          fallbackClassName="size-64 rounded-lg"
        />
        {total > 1 && (
          <button
            type="button"
            aria-label={t("media.next")}
            className="absolute right-2 grid size-11 place-items-center rounded-full bg-white/10 text-white hover:bg-white/25"
            onClick={() => step(1)}
          >
            <ChevronRight className="size-6" />
          </button>
        )}
      </div>

      {current.caption && (
        <p className="pb-6 text-center text-sm text-white/80">{current.caption}</p>
      )}
    </div>
  );
}
