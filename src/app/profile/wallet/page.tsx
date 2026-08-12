"use client";

import { ProfileShell } from "@/modules/layout/profile-shell";
import { WalletPage } from "@/modules/wallet/components/wallet-pages";

// V61: ví khách hàng — nơi tiền hoàn từ refund/tranh chấp về, rút được về ngân hàng.
export default function CustomerWalletRoute() {
  return (
    <ProfileShell>
      <WalletPage scope="customer" />
    </ProfileShell>
  );
}
