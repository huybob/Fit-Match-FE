"use client";

import { BookingWorkspacePage } from "@/modules/booking/components/booking-pages";

export default function TrainerBookingsPage() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <BookingWorkspacePage scope="pt" />
    </main>
  );
}
