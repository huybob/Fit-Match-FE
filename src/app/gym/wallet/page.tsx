"use client";

import { WalletPage } from "@/modules/wallet/components/wallet-pages";

export default function GymWalletRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <WalletPage scope="gym" />
    </main>
  );
}
