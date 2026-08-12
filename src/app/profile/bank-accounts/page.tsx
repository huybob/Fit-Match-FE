"use client";

import { ProfileShell } from "@/modules/layout/profile-shell";
import { BankAccountsPage } from "@/modules/wallet/components/bank-accounts-page";

// V61: dùng chung cho mọi vai trò — gym operator, PT và khách hàng đều rút tiền
// về tài khoản lưu ở đây.
export default function BankAccountsRoute() {
  return (
    <ProfileShell>
      <BankAccountsPage />
    </ProfileShell>
  );
}
