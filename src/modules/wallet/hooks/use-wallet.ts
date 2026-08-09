"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  walletService,
  type BankAccountDto,
  type WalletOwnerType,
  type WithdrawalStatus,
  type WithdrawalRequestDto,
} from "@/services/wallet.service";
import { walletKeys, type WalletScope } from "../query-keys";

const refresh = (c: ReturnType<typeof useQueryClient>) => () =>
  c.invalidateQueries({ queryKey: walletKeys.all });

/** Scope của chủ ví -> loại ví ở BE; "admin" không có ví riêng nên trả null. */
export function ownerTypeOf(scope: WalletScope): WalletOwnerType | null {
  switch (scope) {
    case "gym":
      return "GYM";
    case "customer":
      return "CUSTOMER";
    default:
      return null;
  }
}

export function useWithdrawals(
  scope: WalletScope,
  status?: WithdrawalStatus,
  ownerTypeFilter?: WalletOwnerType,
) {
  const owner = ownerTypeOf(scope);
  return useQuery({
    queryKey: walletKeys.list(scope, status, ownerTypeFilter),
    queryFn: () =>
      owner
        ? walletService.getMine(owner, status)
        : walletService.getAll(status, ownerTypeFilter),
  });
}

/** UC-061: số dư ví của chủ ví tương ứng scope. */
export function useWallet(owner: WalletOwnerType) {
  return useQuery({
    queryKey: walletKeys.wallet(owner),
    queryFn: () => walletService.getWallet(owner),
  });
}

/** UC-061: sổ cái ví. */
export function useWalletTransactions(owner: WalletOwnerType, page: number) {
  return useQuery({
    queryKey: walletKeys.transactions(owner, page),
    queryFn: () => walletService.getWalletTransactions(owner, { page, size: 20 }),
  });
}

export function useCreateWithdrawal(owner: WalletOwnerType) {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequestDto) => walletService.create(owner, payload),
    onSuccess: () => {
      refresh(c)();
      c.invalidateQueries({ queryKey: walletKeys.wallet(owner) });
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

// ---- Tài khoản ngân hàng thụ hưởng (V61) ----

/** Master data ngân hàng; gần như bất biến nên cache dài. */
export function useBanks() {
  return useQuery({
    queryKey: walletKeys.banks,
    queryFn: walletService.getBanks,
    staleTime: 60 * 60 * 1000,
  });
}

export function useBankAccounts() {
  return useQuery({ queryKey: walletKeys.bankAccounts, queryFn: walletService.getBankAccounts });
}

export function useBankAccountMutations() {
  const c = useQueryClient();
  const invalidate = () => c.invalidateQueries({ queryKey: walletKeys.bankAccounts });

  const create = useMutation({
    mutationFn: (payload: BankAccountDto) => walletService.createBankAccount(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: BankAccountDto }) =>
      walletService.updateBankAccount(id, payload),
    onSuccess: invalidate,
  });
  const setDefault = useMutation({
    mutationFn: (id: number) => walletService.setDefaultBankAccount(id),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => walletService.deleteBankAccount(id),
    onSuccess: invalidate,
  });

  return { create, update, setDefault, remove };
}
