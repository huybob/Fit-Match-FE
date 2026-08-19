import { expect, type Page } from "@playwright/test";
import { E2E } from "./env";

/**
 * Thao tác giao diện dùng chung.
 *
 * Đăng nhập đi qua ĐÚNG form thật (điền + submit) chứ không nhét token vào
 * localStorage: một nửa giá trị của đợt test này nằm ở chỗ form, guard và
 * điều hướng theo vai trò có thật sự chạy hay không.
 */
export async function login(
  page: Page,
  account: { username: string; password: string },
): Promise<void> {
  await page.goto("/login");
  await page.getByRole("textbox").first().fill(account.username);
  await page.locator('input[type="password"]').first().fill(account.password);
  await page.getByRole("button", { name: /Đăng nhập|Login|Sign in/i }).first().click();

  // Đăng nhập xong FE điều hướng theo vai trò — chỉ cần rời khỏi /login là đủ.
  await expect(page).not.toHaveURL(/\/login/, { timeout: 20_000 });
}

export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    window.localStorage.removeItem("fitmatch.auth.tokens");
    document.cookie = "fitmatch.session=; path=/; max-age=0; samesite=lax";
  });
  await page.goto("/login");
}

/** Đăng nhập lại bằng tài khoản khác trong cùng một trang. */
export async function switchUser(
  page: Page,
  account: { username: string; password: string },
): Promise<void> {
  await logout(page);
  await login(page, account);
}

/**
 * Chờ toast thành công. Toast của dự án dùng sonner; bắt theo text thay vì
 * role vì nội dung là thứ người dùng thật sự đọc.
 */
export async function expectToast(page: Page, pattern: RegExp): Promise<void> {
  await expect(page.getByText(pattern).first()).toBeVisible({ timeout: 15_000 });
}

export const accounts = E2E.accounts;
