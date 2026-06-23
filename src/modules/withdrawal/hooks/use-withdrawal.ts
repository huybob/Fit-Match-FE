"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  withdrawalService,
  type WithdrawalStatus,
  type WithdrawalRequestDto,
  type RejectWithdrawalRequest,
} from "@/services/withdrawal.service";
import { withdrawalKeys } from "../query-keys";

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: withdrawalKeys.all });

export function useWithdrawals(scope: "pt" | "admin", status?: WithdrawalStatus) {
  return useQuery({
    queryKey: withdrawalKeys.list(scope, status),
    queryFn: () =>
      scope === "pt"
        ? withdrawalService.getMine(status)
        : withdrawalService.getAll(status),
  });
}

export function useCreateWithdrawal() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequestDto) => withdrawalService.create(payload),
    onSuccess: refresh(c),
  });
}

export function useApproveWithdrawal() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withdrawalService.approve(id),
    onSuccess: refresh(c),
  });
}

export function useRejectWithdrawal() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RejectWithdrawalRequest }) =>
      withdrawalService.reject(id, payload),
    onSuccess: refresh(c),
  });
}
