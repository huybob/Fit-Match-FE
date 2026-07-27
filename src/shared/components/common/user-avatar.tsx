"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/cn.util";

/**
 * Ảnh đại diện dùng chung.
 *
 * Trước đây 3 nơi tự dựng `<div className="rounded-full"><img/></div>` với 3 cách
 * tính chữ viết tắt khác nhau, và khi URL ảnh lỗi thì hiện icon ảnh vỡ. Radix
 * Avatar tự chuyển sang fallback khi ảnh không tải được.
 */

/** Chữ viết tắt: 2 từ đầu, không dấu hoa. Rỗng -> "?" */
export function initialsOf(name?: string | null, fallback = "?"): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const text = words.map((w) => w[0]?.toUpperCase() ?? "").join("");
  return text || fallback;
}

/** Màu nền ổn định theo id — cùng một người luôn ra cùng một màu. */
const TINTS = ["bg-primary", "bg-info", "bg-success", "bg-warning"] as const;
export function avatarTint(seed?: number | null): string {
  return TINTS[Math.abs(seed ?? 0) % TINTS.length];
}

export interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof Avatar> {
  src?: string | null;
  /** Tên dùng cho alt và chữ viết tắt. */
  name?: string | null;
  /** Có thì tô nền theo id để phân biệt người dùng trong danh sách. */
  tintSeed?: number | null;
  /** Nội dung thay chữ viết tắt (vd. icon) khi không có tên. */
  fallback?: React.ReactNode;
  fallbackClassName?: string;
}

export function UserAvatar({
  src,
  name,
  tintSeed,
  fallback,
  className,
  fallbackClassName,
  ...props
}: UserAvatarProps) {
  const label = name?.trim() || undefined;
  return (
    <Avatar className={className} {...props}>
      {src ? <AvatarImage src={src} alt={label ?? ""} /> : null}
      <AvatarFallback
        className={cn(
          tintSeed !== undefined && `${avatarTint(tintSeed)} text-white`,
          fallbackClassName,
        )}
      >
        {fallback ?? initialsOf(label)}
      </AvatarFallback>
    </Avatar>
  );
}
