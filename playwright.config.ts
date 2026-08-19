import { defineConfig } from "@playwright/test";

/**
 * E2E cho luồng mua vé + đặt lịch trên mô hình "Gym xếp ca — PT xin nghỉ".
 *
 * Chạy tuần tự một worker: các spec dùng CHUNG một môi trường có trạng thái
 * (gym đã duyệt, ca đã khai, vé đã mua) và cố ý phụ thuộc nhau theo thứ tự chữ
 * cái — song song hoá sẽ làm chúng giẫm lên nhau. Riêng ca đua (nhóm E) tự bắn
 * request song song bên trong spec.
 *
 * BE và FE phải được khởi động trước (xem e2e/README.md); config KHÔNG tự bật
 * server vì backend cần schema sạch + biến môi trường riêng cho từng lượt chạy.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["line"]],
  use: {
    baseURL: process.env.E2E_WEB_URL ?? "http://localhost:3100",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    locale: "vi-VN",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
