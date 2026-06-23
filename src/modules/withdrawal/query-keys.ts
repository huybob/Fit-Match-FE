import type { WithdrawalStatus } from "@/services/withdrawal.service";

export const withdrawalKeys = {
  all: ["withdrawals"] as const,
  list: (scope: "pt" | "admin", status?: WithdrawalStatus) =>
    [...withdrawalKeys.all, scope, status] as const,
};
