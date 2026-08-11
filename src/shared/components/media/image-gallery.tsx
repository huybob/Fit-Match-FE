"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Media } from "@/types/Media";
import { cn } from "@/shared/utils/cn.util";
import { ImageViewer } from "./image-viewer";
import { SmartImage } from "./smart-image";

/**
 * Lưới ảnh chỉ-đọc + lightbox. Dùng chung cho thư viện gym/chi nhánh, ảnh đính
 * kèm đánh giá và ảnh check-in — mỗi màn hình chỉ khác số cột.
 *
 * Lưới hiển thị `thumbnailUrl` (bản BE sinh sẵn ~400px); ảnh gốc chỉ tải khi mở
 * lightbox, nên một trang 12 ảnh không kéo về vài chục MB.
 */
export function ImageGallery({
  images,
  columns = 4,
  className,
  thumbnailClassName,
}: {
  images: Media[];
  columns?: 2 | 3 | 4 | 6;
  className?: string;
  thumbnailClassName?: string;
}) {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!images.length) return null;

  const columnClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
    6: "grid-cols-3 sm:grid-cols-4 lg:grid-cols-6",
  }[columns];

  return (
    <>
      <ul className={cn("grid gap-2", columnClass, className)}>
        {images.map((image, index) => (
          <li key={image.id}>
            <button
              type="button"
              className="group block w-full overflow-hidden rounded-xl border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              onClick={() => setOpenIndex(index)}
              aria-label={t("media.openImage", { index: index + 1 })}
            >
              <SmartImage
                src={image.thumbnailUrl || image.url}
                alt={image.caption || t("media.imageAlt")}
                className={cn(
                  "aspect-square w-full bg-muted/40 object-cover transition group-hover:scale-105",
                  thumbnailClassName,
                )}
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <ImageViewer
          images={images}
          index={openIndex}
          onIndexChange={setOpenIndex}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </>
  );
}
