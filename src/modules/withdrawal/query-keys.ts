import type { WithdrawalStatus } from "@/services/withdrawal.service";

export const withdrawalKeys = {
  all: ["withdrawals"] as const,
  wallet: ["gym-wallet"] as const,
  list: (scope: "gym" | "admin", status?: WithdrawalStatus) =>
    [...withdrawalKeys.all, scope, status] as const,
};
