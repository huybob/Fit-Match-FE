"use client";

import { WithdrawalsPage } from "@/modules/withdrawal/components/withdrawal-pages";

export default function GymWithdrawalsPage() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <WithdrawalsPage scope="gym" />
    </main>
  );
}
