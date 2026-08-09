"use client";

import { WalletPage } from "@/modules/wallet/components/wallet-pages";

// V61: ví khách hàng — nơi tiền hoàn từ refund/tranh chấp về, rút được về ngân hàng.
export default function CustomerWalletRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <WalletPage scope="customer" />
    </main>
  );
}
