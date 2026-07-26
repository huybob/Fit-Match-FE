"use client";

import { enUS, vi } from "date-fns/locale";
import type { Locale as DateFnsLocale } from "date-fns";
import { useLocale } from "next-intl";
import { resolveLocale, type Locale } from "./config";

const DATE_LOCALES: Record<Locale, DateFnsLocale> = {
  vi,
  en: enUS,
};

/**
 * Locale của date-fns tương ứng ngôn ngữ đang chọn — dùng cho Calendar và
 * mọi chỗ format ngày/giờ để tên tháng, thứ hiển thị đúng ngôn ngữ.
 */
export function useDateLocale(): DateFnsLocale {
  return DATE_LOCALES[resolveLocale(useLocale())];
}

/** Định dạng ngày theo thói quen từng ngôn ngữ. */
export const DATE_FORMATS: Record<Locale, { date: string; dateTime: string }> = {
  vi: { date: "dd/MM/yyyy", dateTime: "dd/MM/yyyy HH:mm" },
  en: { date: "MMM d, yyyy", dateTime: "MMM d, yyyy HH:mm" },
};

export function useDateFormats() {
  return DATE_FORMATS[resolveLocale(useLocale())];
}
