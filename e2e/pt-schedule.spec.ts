import { test, expect } from "@playwright/test";

/** Read-only UI tests with deterministic API projections; no application DB is used. */
test.beforeEach(async ({ page }) => {
  await page.route("**/api/**", async route => {
    const url = new URL(route.request().url());
    let data: unknown = [];
    if (url.pathname === "/api/marketplace/pts/11") data = {
      id: 11, displayName: "Trainer Test", gymId: 1, gymName: "Gym Test", branches: [{ id: 22, name: "Branch A" }],
      certifications: [], averageRating: 4.8, reviewCount: 0, verified: true,
    };
    if (url.pathname === "/api/marketplace/pts/11/schedule") {
      const date = url.searchParams.get("from")!;
      data = { ptId: 11, branchId: 22, timezone: "Asia/Ho_Chi_Minh", updatedAt: "2026-10-13T10:00:00",
        branches: [{ id: 22, name: "Branch A" }], days: [{ date, status: "WORKING",
          workingHours: [{ start: "08:00:00", end: "11:00:00" }],
          slots: [{ start: "08:00:00", end: "09:00:00", status: "FREE" },
            { start: "09:00:00", end: "10:00:00", status: "BUSY" },
            { start: "10:00:00", end: "11:00:00", status: "LEAVE" }],
        }],
      };
    }
    await route.fulfill({ contentType: "application/json", headers: { "access-control-allow-origin": "*" },
      body: JSON.stringify({ success: true, data }) });
  });
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
  test(`guest sees schedule and navigates weeks at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/trainers/11");
    const calendar = page.getByRole("region", { name: /Lịch làm việc PT|Trainer schedule/ });
    await expect(calendar).toBeVisible();
    await expect(calendar.getByText("08:00–09:00", { exact: true })).toBeVisible();
    await expect(calendar.getByText("09:00–10:00", { exact: true })).toBeVisible();
    await expect(calendar.getByText("10:00–11:00", { exact: true })).toBeVisible();
    const changed = page.waitForRequest(request => request.url().includes("/schedule?") && request.method() === "GET");
    await calendar.getByRole("button", { name: /Tuần sau|Next week/ }).click();
    await changed;
    await expect(calendar.getByText("08:00–09:00", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await calendar.screenshot({ path: `node_modules/.cache/pt-schedule-${viewport.width}.png` });
  });
}
