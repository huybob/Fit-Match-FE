"use client";

import { WithdrawalsPage } from "@/modules/withdrawal/components/withdrawal-pages";

// D-15 (audit 2026-07-17): bỏ SiteLayout lồng trong AdminShell (double header/footer).
export default function AdminWithdrawalsRoute() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <WithdrawalsPage scope="admin" />
    </div>
  );
}
