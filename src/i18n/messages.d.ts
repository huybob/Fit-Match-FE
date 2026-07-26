import type viMessages from "../../messages/vi.json";

/**
 * Bật kiểm tra key dịch ở compile-time: gõ sai t("common.actons.save")
 * sẽ báo lỗi TypeScript thay vì âm thầm hiện fallback lúc chạy.
 * vi.json là nguồn chuẩn (source of truth) cho tập key.
 */
declare module "next-intl" {
  interface AppConfig {
    Messages: typeof viMessages;
  }
}
