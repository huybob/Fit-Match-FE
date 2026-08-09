"use client";

import { BankAccountsPage } from "@/modules/wallet/components/bank-accounts-page";

// V61: dùng chung cho mọi vai trò — gym operator, PT và khách hàng đều rút tiền
// về tài khoản lưu ở đây.
export default function BankAccountsRoute() {
  return (
    <main className="flex-1 min-w-0 overflow-y-auto p-6">
      <BankAccountsPage />
    </main>
  );
}
