import type { WalletOwnerType, WithdrawalStatus } from "@/services/wallet.service";

/** Scope của trang ví: hai loại chủ ví + hàng đợi của admin/finance. */
export type WalletScope = "gym" | "customer" | "admin";

export const walletKeys = {
  all: ["withdrawals"] as const,
  /** Số dư + sổ cái tách theo loại chủ ví — gym operator cũng có ví khách hàng riêng. */
  wallet: (owner: WalletOwnerType) => ["wallet", owner] as const,
  transactions: (owner: WalletOwnerType, page: number) =>
    ["wallet", owner, "transactions", page] as const,
  bankAccounts: ["bank-accounts"] as const,
  banks: ["banks"] as const,
  list: (scope: WalletScope, status?: WithdrawalStatus, ownerType?: WalletOwnerType) =>
    [...walletKeys.all, scope, status, ownerType] as const,
};
