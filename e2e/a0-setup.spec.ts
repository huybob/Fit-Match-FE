import { test, expect } from "@playwright/test";
import { api, asAdmin, asGym } from "./fixtures/api";
import { E2E, nextWeekday } from "./fixtures/env";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dựng dữ liệu nền cho cả bộ e2e.
 *
 * Phần này đi qua API chứ không qua giao diện — có chủ ý. Duyệt hồ sơ gym, tạo
 * chi nhánh, khai giờ mở cửa, tạo loại vé đều là chức năng CŨ, không nằm trong
 * phạm vi đợt đổi mô hình lịch PT; lái chúng bằng UI chỉ làm bộ test dài và dễ
 * vỡ vì lý do không liên quan. Những màn hình MỚI (ca, phân ca, đơn nghỉ, banner
 * mất PT) được kiểm bằng giao diện thật ở các spec sau.
 *
 * Kết quả ghi ra e2e/.state.json để các spec sau dùng lại id.
 */
export interface E2EState {
  branchId: number;
  ptId: number;
  ptUsername: string;
  dayTypeId: number;
  packageTypeId: number;
  freeTypeId: number;
  voucherCode: string;
}

export const STATE_FILE = join(process.cwd(), "e2e", ".state.json");

test.describe.configure({ mode: "serial" });

test("a0 — dựng gym đã duyệt, chi nhánh, giờ mở cửa, PT, loại vé", async () => {
  // ---------- Hồ sơ gym + duyệt ----------
  const existing = await api<{ verificationStatus?: string }>("/gym/verification-status", {
    as: asGym,
  });
  if (existing.data?.verificationStatus !== "APPROVED") {
    if (!existing.data?.verificationStatus || existing.data.verificationStatus === "NOT_SUBMITTED") {
      const submitted = await api("/gym/registration", {
        method: "POST",
        as: asGym,
        body: {
          gymName: "FitMatch E2E",
          description: "Gym dung cho e2e",
          address: "1 Duong Test, Ha Noi",
          city: "Ha Noi",
          district: "Ba Dinh",
          phone: "0901234567",
          documents: [{ documentType: "BUSINESS_LICENSE", fileUrl: "/uploads/documents/e2e.pdf" }],
        },
      });
      expect(submitted.ok, submitted.message).toBeTruthy();
    }
    const pending = await api<{ content: { id: number }[] }>(
      "/admin/gym-verifications?status=PENDING&page=0&size=20",
      { as: asAdmin },
    );
    const gymProfileId = pending.data.content[0]?.id;
    expect(gymProfileId, "phai co ho so gym cho duyet").toBeTruthy();

    const approved = await api<{ verificationStatus: string }>(
      `/admin/gym-verifications/${gymProfileId}/approve`,
      { method: "POST", as: asAdmin, body: { note: "e2e" } },
    );
    expect(approved.data.verificationStatus).toBe("APPROVED");
  }

  // ---------- Chi nhánh ----------
  const branches = await api<{ id: number; name: string }[]>("/gym/branches", { as: asGym });
  let branchId = branches.data?.find((b) => b.name === "CN E2E")?.id ?? 0;
  if (!branchId) {
    const created = await api<{ id: number }>("/gym/branches", {
      method: "POST",
      as: asGym,
      body: { name: "CN E2E", address: "1 Duong Test, Ha Noi", phone: "0901234567" },
    });
    expect(created.ok, created.message).toBeTruthy();
    branchId = created.data.id;
  }

  // Mở cửa 06:00-22:00 T2..T7, đóng cửa Chủ nhật — Chủ nhật đóng là có chủ ý:
  // nhóm xếp ca cần một ngày bị BỎ QUA để kiểm báo cáo "skippedClosed".
  const hours = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
    dayOfWeek,
    openTime: "06:00",
    closeTime: "22:00",
    closed: false,
  }));
  hours.push({ dayOfWeek: 7, openTime: "06:00", closeTime: "22:00", closed: true });
  const hoursSaved = await api(`/gym/branches/${branchId}/operating-hours`, {
    method: "PUT",
    as: asGym,
    body: { hours },
  });
  expect(hoursSaved.ok, hoursSaved.message).toBeTruthy();

  // ---------- PT ----------
  const pts = await api<{ content: { id: number; username: string }[] }>(
    "/gym/pts?page=0&size=50",
    { as: asGym },
  );
  let ptId = pts.data?.content?.find((p) => p.username === E2E.pt.username)?.id ?? 0;
  if (!ptId) {
    const created = await api<{ id: number }>("/gym/pts", {
      method: "POST",
      as: asGym,
      body: {
        username: E2E.pt.username,
        email: `${E2E.pt.username}@fitmatch.local`,
        password: E2E.pt.password,
        displayName: E2E.pt.displayName,
        phone: "0912345678",
        branchIds: [branchId],
      },
    });
    expect(created.ok, created.message).toBeTruthy();
    ptId = created.data.id;
  }

  // ---------- Loại vé ----------
  const types = await api<{ id: number; name: string }[]>("/gym/ticket-types", { as: asGym });
  const byName = new Map((types.data ?? []).map((t) => [t.name, t.id]));

  async function ensureType(
    name: string,
    body: Record<string, unknown>,
  ): Promise<number> {
    const found = byName.get(name);
    if (found) return found;
    const created = await api<{ id: number }>("/gym/ticket-types", {
      method: "POST",
      as: asGym,
      body: { ...body, name, branchIds: [branchId] },
    });
    expect(created.ok, `${name}: ${created.message}`).toBeTruthy();
    const id = created.data.id;
    // Vé phải PUBLISHED mới bán được — mặc định catalog là nháp.
    await api(`/gym/ticket-types/${id}/catalog-status`, {
      method: "PATCH",
      as: asGym,
      body: { status: "PUBLISHED" },
    });
    return id;
  }

  // ptSurchargePerDay khác 0 là bắt buộc: toàn bộ nhóm C (hoàn phụ phí HLV khi
  // PT nghỉ) tính tiền từ đúng con số này.
  const dayTypeId = await ensureType("Ve ngay E2E", {
    kind: "DAY",
    dayCount: 1,
    price: 200000,
    ptSurchargePerDay: 150000,
  });
  const packageTypeId = await ensureType("Ve goi 5 ngay E2E", {
    kind: "PACKAGE",
    dayCount: 5,
    price: 800000,
    ptSurchargePerDay: 100000,
  });
  const freeTypeId = await ensureType("Ve ngay gia thap E2E", {
    kind: "DAY",
    dayCount: 1,
    price: 100000,
    ptSurchargePerDay: 50000,
  });

  const state: E2EState = {
    branchId,
    ptId,
    ptUsername: E2E.pt.username,
    dayTypeId,
    packageTypeId,
    freeTypeId,
    voucherCode: "E2E100",
  };
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf8");

  expect(branchId).toBeGreaterThan(0);
  expect(ptId).toBeGreaterThan(0);
  // Chủ nhật đóng cửa -> phải tồn tại ít nhất một Chủ nhật trong 14 ngày tới để
  // spec xếp ca kiểm được nhánh "bỏ qua ngày đóng cửa".
  expect(nextWeekday(7)).toBeTruthy();
});
