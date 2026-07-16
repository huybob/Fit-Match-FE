"use client";

import { ReportPage } from "@/modules/report/report-page";

export default function AdminAnalyticsRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <ReportPage scope="admin" />
    </main>
  );
}
