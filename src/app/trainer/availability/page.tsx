"use client";

import { TrainerShiftSchedulePage } from "@/modules/trainer/components/trainer-shift-schedule";
import { AuthGuard } from "@/modules/auth/auth-guard";
import { SiteLayout } from "@/modules/layout/site-layout";

/**
 * Route giữ nguyên /trainer/availability (link cũ, sidebar, thông báo BE đều trỏ
 * vào đây) nhưng NỘI DUNG đã đổi hẳn: BE V85 chuyển quyền xếp lịch sang Gym, PT
 * chỉ xem lịch ca của mình và gửi đơn xin nghỉ.
 */
export default function TrainerShiftRoute() {
  return (
    <SiteLayout>
      <AuthGuard roles={["ROLE_PT"]}>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <TrainerShiftSchedulePage />
        </main>
      </AuthGuard>
    </SiteLayout>
  );
}
