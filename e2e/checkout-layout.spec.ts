import { expect, test, type Page } from "@playwright/test";

const ticketName = "Gói tập toàn diện 30 ngày kết hợp huấn luyện cá nhân tại chi nhánh trung tâm";
const serviceName = "Phục hồi thể lực và xông hơi sau mỗi buổi tập cùng chuyên gia";

async function mockCheckout(page: Page) {
  await page.context().addCookies([{ name: "fitmatch.locale", value: "vi", url: test.info().project.use.baseURL! }]);
  await page.addInitScript(() => {
    localStorage.setItem("fitmatch.auth.tokens", JSON.stringify({
      accessToken: "layout-test", refreshToken: "layout-test", expiresAt: Date.now() + 3_600_000,
    }));
    localStorage.setItem("fitmatch.theme", "light");
  });
  await page.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const services = [{ id: 2, name: serviceName, price: 1_500_000, description: "Dịch vụ bổ sung cho toàn bộ gói tập tại phòng gym." }];
    let data: unknown = [];
    if (pathname.endsWith("/user/profile")) {
      data = { id: 1, username: "layout-test", fullName: "Khách hàng", role: "ROLE_CUSTOMER", emailVerified: true };
    } else if (pathname.endsWith("/ticket-types")) {
      data = [{ id: 1, name: ticketName, kind: "PACKAGE", dayCount: 30, minutesPerDay: 90,
        price: 15_000_000, ptSurchargePerDay: 1_000_000, priceWithPt: 45_000_000,
        description: "Tập luyện không giới hạn với đầy đủ quyền lợi và hỗ trợ chuyên sâu từ huấn luyện viên." }];
    } else if (pathname.endsWith("/services")) {
      data = services;
    } else if (pathname.endsWith("/tickets/quote")) {
      data = { ticketTypeName: ticketName, dayCount: 30, baseAmount: 15_000_000,
        ptSurchargeAmount: 30_000_000, servicesAmount: 1_500_000, totalAmount: 46_500_000,
        payableAmount: 46_500_000, voucherDiscount: 0, loyaltyDiscount: 0,
        loyaltyPointsUsed: 0, loyaltyPointsAvailable: 100, services };
    } else if (pathname.endsWith("/loyalty")) {
      data = { pointsBalance: 100, pointValue: 1000, vndPerPoint: 10000, history: { content: [] } };
    } else if (pathname.includes("unread")) {
      data = { unreadCount: 0 };
    } else if (/\/tickets\/\d+\/payment$/.test(pathname)) {
      data = { id: 8, status: "PENDING", amount: 46_500_000,
        refCode: "FITMATCH1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890", expiresAt: "2099-11-05T12:00:00" };
    }
    await route.fulfill({ json: { success: true, data } });
  });
}

async function expectDialogFits(page: Page) {
  const dialog = page.getByRole("dialog");
  // Allow the opening animation to finish before measuring the final bounds.
  await expect.poll(() => dialog.evaluate((el) => el.getAnimations().filter((animation) => animation.playState === "running").length)).toBe(0);
  const bounds = await dialog.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
      width: innerWidth, height: innerHeight, overflow: el.scrollWidth - el.clientWidth };
  });
  expect(bounds.left).toBeGreaterThanOrEqual(15);
  expect(bounds.right).toBeLessThanOrEqual(bounds.width - 15);
  expect(bounds.top).toBeGreaterThanOrEqual(0);
  expect(bounds.bottom).toBeLessThanOrEqual(bounds.height);
  expect(bounds.overflow).toBeLessThanOrEqual(1);
  await expect(dialog.getByRole("heading", { level: 2 })).toBeInViewport({ ratio: 1 });
  for (const value of await dialog.locator("dd").all()) {
    expect(await value.evaluate((el) => getComputedStyle(el).whiteSpace)).toBe("nowrap");
  }
}

for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
  test(`checkout keeps long names and prices readable at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await mockCheckout(page);
    await page.goto("/checkout?branchId=2&ticketTypeId=1&withPt=1");
    const dialog = page.getByRole("dialog");
    const next = dialog.getByRole("button", { name: "Tiếp", exact: true });
    await expect(next).toBeEnabled();
    for (const stage of ["type", "pt", "services", "promo", "confirm"]) {
      await expectDialogFits(page);
      await expect(dialog.locator("[aria-current=step]")).toHaveCount(1);
      if (viewport.width < 640 && stage === "type") {
        const name = await dialog.getByText(ticketName, { exact: true }).boundingBox();
        const price = await dialog.getByText("15.000.000 ₫", { exact: true }).boundingBox();
        expect(price!.y).toBeGreaterThanOrEqual(name!.y + name!.height);
      }
      if (viewport.width < 640 && stage === "services") {
        const name = await dialog.getByText(serviceName, { exact: true }).boundingBox();
        const price = await dialog.getByText("1.500.000 ₫", { exact: true }).boundingBox();
        expect(price!.y).toBeGreaterThanOrEqual(name!.y + name!.height);
      }
      if (stage === "confirm") {
        const buy = dialog.getByRole("button", { name: "Mua vé", exact: true });
        await expect(buy).toBeInViewport({ ratio: 1 });
      } else {
        if (stage === "services") await dialog.getByRole("button", { name: new RegExp(serviceName) }).click();
        await next.click();
      }
    }
    // Pending payment shares the same responsive modal and must wrap long refs.
    await page.goto("/checkout?ticketId=8");
    await expect(dialog.getByText(/FITMATCH123456/)).toBeVisible();
    await expectDialogFits(page);
  });
}
