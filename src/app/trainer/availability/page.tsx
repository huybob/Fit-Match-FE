"use client";

import { TrainerShiftSchedulePage } from "@/modules/trainer/components/trainer-shift-schedule";

/**
 * Route giữ nguyên /trainer/availability (link cũ, sidebar, thông báo BE đều trỏ
 * vào đây) nhưng NỘI DUNG đã đổi hẳn: BE V85 chuyển quyền xếp lịch sang Gym, PT
 * chỉ xem lịch ca của mình và gửi đơn xin nghỉ.
 *
 * <p>KHÔNG bọc SiteLayout và AuthGuard ở đây: src/app/trainer/layout.tsx đã bọc
 * TrainerLayout (sidebar + WorkspaceHeader + AuthGuard ROLE_PT). Bọc thêm thì ra
 * hai thanh header lồng nhau, và tệ hơn: TrainerLayout là khung `h-screen
 * overflow-hidden`, phần cuộn phải do chính trang dựng — trang này không có
 * `overflow-y-auto` nào nên nội dung dài bị cắt cụt, không kéo xuống được.
 * Các trang PT khác đều trả thẳng <main> như dưới đây.
 */
export default function TrainerShiftRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <TrainerShiftSchedulePage />
    </main>
  );
}
