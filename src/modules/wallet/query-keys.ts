import type { WithdrawalStatus } from "@/services/wallet.service";

export const walletKeys = {
  all: ["withdrawals"] as const,
  wallet: ["gym-wallet"] as const,
  list: (scope: "gym" | "admin", status?: WithdrawalStatus) =>
    [...walletKeys.all, scope, status] as const,
};
