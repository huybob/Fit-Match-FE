"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  withdrawalService,
  type WithdrawalStatus,
  type WithdrawalRequestDto,
} from "@/services/withdrawal.service";
import { withdrawalKeys } from "../query-keys";

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: withdrawalKeys.all });

export function useWithdrawals(scope: "gym" | "admin", status?: WithdrawalStatus) {
  return useQuery({
    queryKey: withdrawalKeys.list(scope, status),
    queryFn: () =>
      scope === "gym"
        ? withdrawalService.getMine(status)
        : withdrawalService.getAll(status),
  });
}

/** UC-061: số dư ví gym. */
export function useGymWallet() {
  return useQuery({ queryKey: withdrawalKeys.wallet, queryFn: withdrawalService.getWallet });
}

/** UC-061: sổ cái ví gym. */
export function useGymWalletTransactions(page: number) {
  return useQuery({
    queryKey: [...withdrawalKeys.wallet, "transactions", page],
    queryFn: () => withdrawalService.getWalletTransactions({ page, size: 20 }),
  });
}

export function useCreateWithdrawal() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequestDto) => withdrawalService.create(payload),
    onSuccess: () => {
      refresh(c)();
      c.invalidateQueries({ queryKey: withdrawalKeys.wallet });
    },
  });
}

export function useWithdrawalDecision() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, decision, note, payoutReference }: {
      id: number;
      decision: "approve" | "reject" | "markPaid";
      note?: string;
      /** D-11: bắt buộc với markPaid. */
      payoutReference?: string;
    }) =>
      decision === "approve"
        ? withdrawalService.approve(id, note)
        : decision === "reject"
          ? withdrawalService.reject(id, note ?? "")
          : withdrawalService.markPaid(id, payoutReference ?? "", note),
    onSuccess: refresh(c),
  });
}
