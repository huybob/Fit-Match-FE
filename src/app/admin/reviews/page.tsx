"use client";

import { ReviewModerationPage } from "@/modules/review/components/moderation-page";

export default function AdminReviewsRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <ReviewModerationPage />
    </main>
  );
}
