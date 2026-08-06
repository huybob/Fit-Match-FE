"use client";

import { WalletPage } from "@/modules/wallet/components/wallet-pages";

// D-15 (audit 2026-07-17): bỏ SiteLayout lồng trong AdminShell (double header/footer).
// Route giữ tên /admin/withdrawals: màn admin chỉ là hàng đợi duyệt lệnh rút,
// không hiển thị ví — khác với /gym/wallet.
export default function AdminWithdrawalsRoute() {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <WalletPage scope="admin" />
    </div>
  );
}
