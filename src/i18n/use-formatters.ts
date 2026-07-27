"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { HTML_LANG, resolveLocale } from "./config";

/**
 * Formatter ngày/giờ theo NGÔN NGỮ ĐANG CHỌN.
 *
 * Trước đây 6 file tự khai báo `timeText`/`dateTimeText` ở module scope với
 * `Intl.DateTimeFormat("vi-VN", ...)` cứng — đổi sang tiếng Anh thì ngày vẫn
 * hiện kiểu Việt. Gom về một chỗ và lấy locale từ next-intl.
 *
 * Lưu ý: tiền tệ vẫn dùng `formatCurrency` (luôn VND, kiểu vi-VN) vì số tiền là
 * đồng Việt Nam bất kể ngôn ngữ giao diện.
 */
export function useFormatters() {
  const locale = resolveLocale(useLocale());

  return useMemo(() => {
    const tag = HTML_LANG[locale];
    const mk = (options: Intl.DateTimeFormatOptions) => {
      const fmt = new Intl.DateTimeFormat(tag, options);
      return (value?: string | Date | null, fallback = "—") =>
        value ? fmt.format(typeof value === "string" ? new Date(value) : value) : fallback;
    };

    return {
      /** 26/07/2026 · Jul 26, 2026 */
      date: mk({ dateStyle: "medium" }),
      /** 26/07/2026 · 7/26/2026 */
      dateShort: mk({ dateStyle: "short" }),
      /** 26/07/2026, 09:12 */
      dateTime: mk({ dateStyle: "medium", timeStyle: "short" }),
      /** 26/07/2026, 09:12 (dạng ngắn) */
      dateTimeShort: mk({ dateStyle: "short", timeStyle: "short" }),
      /** 26/07/2026, 09:12:30 — dùng cho nhật ký kiểm toán */
      dateTimeSeconds: mk({ dateStyle: "short", timeStyle: "medium" }),
      /** 09:12 */
      time: mk({ timeStyle: "short" }),
      /** tháng 7 năm 2026 · July 2026 — dùng cho "thành viên từ" */
      monthYear: mk({ month: "long", year: "numeric" }),
      number: (value?: number | null, fallback = "—") =>
        value == null ? fallback : new Intl.NumberFormat(tag).format(value),
    };
  }, [locale]);
}

export type Formatters = ReturnType<typeof useFormatters>;
