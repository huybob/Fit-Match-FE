"use client";

import { TrainerSessionsPage } from "@/modules/ticket/components/trainer-sessions";

// Sidebar, header và AuthGuard đã nằm ở src/app/trainer/layout.tsx — bọc thêm
// SiteLayout ở đây sẽ ra hai bộ chrome lồng nhau bên trong một khung
// `h-screen overflow-hidden`, và nội dung mất luôn khả năng cuộn.
export default function TrainerBookingsRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <TrainerSessionsPage />
    </main>
  );
}
