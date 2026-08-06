"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  walletService,
  type WithdrawalStatus,
  type WithdrawalRequestDto,
} from "@/services/wallet.service";
import { walletKeys } from "../query-keys";

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: walletKeys.all });

export function useWithdrawals(scope: "gym" | "admin", status?: WithdrawalStatus) {
  return useQuery({
    queryKey: walletKeys.list(scope, status),
    queryFn: () =>
      scope === "gym"
        ? walletService.getMine(status)
        : walletService.getAll(status),
  });
}

/** UC-061: số dư ví gym. */
export function useGymWallet() {
  return useQuery({ queryKey: walletKeys.wallet, queryFn: walletService.getWallet });
}

/** UC-061: sổ cái ví gym. */
export function useGymWalletTransactions(page: number) {
  return useQuery({
    queryKey: [...walletKeys.wallet, "transactions", page],
    queryFn: () => walletService.getWalletTransactions({ page, size: 20 }),
  });
}

export function useCreateWithdrawal() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequestDto) => walletService.create(payload),
    onSuccess: () => {
      refresh(c)();
      c.invalidateQueries({ queryKey: walletKeys.wallet });
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
        ? walletService.approve(id, note)
        : decision === "reject"
          ? walletService.reject(id, note ?? "")
          : walletService.markPaid(id, payoutReference ?? "", note),
    onSuccess: refresh(c),
  });
}
