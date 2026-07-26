import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, resolveLocale, type Locale } from "./config";

/**
 * Nguồn cấu hình i18n cho mọi request phía server.
 *
 * Locale đọc từ cookie (không có prefix trên URL). Nếu cookie thiếu hoặc sai
 * giá trị thì rơi về DEFAULT_LOCALE nên không bao giờ render lỗi vì thiếu locale.
 */
async function loadMessages(locale: Locale) {
  return (await import(`../../messages/${locale}.json`)).default;
}

export default getRequestConfig(async () => {
  const store = await cookies();
  const locale = resolveLocale(store.get(LOCALE_COOKIE)?.value);

  let messages: Record<string, unknown>;
  try {
    messages = await loadMessages(locale);
  } catch {
    // Phòng trường hợp file messages của locale bị thiếu — vẫn phải render được.
    messages = await loadMessages(DEFAULT_LOCALE);
  }

  return {
    locale,
    messages,
    // Sai key dịch không được làm sập trang; chỉ log ở môi trường dev.
    onError(error) {
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] ${error.message}`);
      }
    },
    getMessageFallback({ key }) {
      return process.env.NODE_ENV === "development" ? `⟪${key}⟫` : key.split(".").pop()!;
    },
  };
});
