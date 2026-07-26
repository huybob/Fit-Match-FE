/**
 * Cấu hình i18n dùng chung cho cả server và client.
 *
 * Chiến lược: locale lưu trong cookie, KHÔNG thêm prefix vào URL.
 * Nhờ vậy toàn bộ route hiện có (/admin/users, /gym/branches, ...) giữ nguyên —
 * không ảnh hưởng link đã share, middleware auth hay các luồng redirect.
 */

export const LOCALES = ["vi", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "vi";

/** Tên cookie giữ locale. Đọc được ở cả server (RSC) và client. */
export const LOCALE_COOKIE = "fitmatch.locale";

/** Cookie sống 1 năm — locale là lựa chọn lâu dài của người dùng. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/** Chuẩn hoá giá trị bất kỳ về một locale hợp lệ. */
export function resolveLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Nhãn hiển thị trong bộ chuyển ngôn ngữ — luôn viết bằng chính ngôn ngữ đó. */
export const LOCALE_LABELS: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
};

/** Nhãn ngắn cho nút trên header (khi chật chỗ). */
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  vi: "VI",
  en: "EN",
};

/** Locale dạng BCP-47 để dùng cho <html lang>, Intl.* và date-fns. */
export const HTML_LANG: Record<Locale, string> = {
  vi: "vi-VN",
  en: "en-US",
};
