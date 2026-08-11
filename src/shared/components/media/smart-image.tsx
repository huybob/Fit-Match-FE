"use client";

import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/utils/cn.util";

/**
 * Ảnh có phương án dự phòng. Signed URL của bucket private có hạn dùng, ảnh cũ
 * có thể đã bị xoá khỏi storage — không xử lý thì trang hiện icon "ảnh vỡ" của
 * trình duyệt, trông như lỗi hệ thống.
 *
 * `key={src}` không dùng được vì component có thể được tái sử dụng với cùng vị
 * trí; thay vào đó reset cờ lỗi mỗi khi `src` đổi.
 */
export function SmartImage({
  src,
  alt,
  className,
  fallbackClassName,
  fallback,
  loading = "lazy",
}: {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  /** Nội dung thay thế; mặc định là ô xám có icon. */
  fallback?: React.ReactNode;
  loading?: "lazy" | "eager";
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn(
          "grid place-items-center bg-muted text-muted-foreground",
          className,
          fallbackClassName,
        )}
      >
        {fallback ?? <ImageOff className="size-1/4 max-h-8 max-w-8 opacity-60" />}
      </div>
    );
  }

  // Dùng <img> chứ không phải next/image: ảnh đến từ bucket GCS mà host đổi theo
  // môi trường (dev/uat/prod), và signed URL có query string đổi mỗi lần tải —
  // next/image sẽ cần khai báo remotePatterns cho từng bucket và không cache được.
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
