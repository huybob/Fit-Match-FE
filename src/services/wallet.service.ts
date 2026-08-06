import { api } from "@/services/api";
import type {
  Wallet,
  WalletTransactionPage,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Wallet";

export type {
  Wallet,
  WalletTransaction,
  WalletTransactionPage,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Wallet";

/**
 * Contract BE: gym dùng /gym/wallet/**; admin/finance dùng /admin/withdrawals.
 * Duyệt 2 bước: approve -> (chuyển khoản thủ công) -> mark-paid; reject trả tiền về available.
 */
export const walletService = {
  // ---- Gym (UC-061/062) ----
  getWallet: () => api.get<Wallet>("/gym/wallet"),
  getWalletTransactions: (params: { page?: number; size?: number } = {}) =>
    api.get<WalletTransactionPage>("/gym/wallet/transactions", {
      params: { page: 0, size: 20, ...params },
    }),
  getMine: (status?: WithdrawalStatus) =>
    api.get<WithdrawalPage>("/gym/wallet/withdrawals", {
      params: { page: 0, size: 20, status },
    }),
  create: (payload: WithdrawalRequestDto) =>
    api.post<Withdrawal, WithdrawalRequestDto>("/gym/wallet/withdrawals", payload),

  // ---- Admin / Finance (UC-062) ----
  getAll: (status?: WithdrawalStatus) =>
    api.get<WithdrawalPage>("/admin/withdrawals", {
      params: { page: 0, size: 20, status },
    }),
  approve: (id: number, note?: string) =>
    api.post<Withdrawal, { note?: string }>(`/admin/withdrawals/${id}/approve`, { note }),
  reject: (id: number, note: string) =>
    api.post<Withdrawal, { note: string }>(`/admin/withdrawals/${id}/reject`, { note }),
  // D-11: BE bắt buộc payoutReference (mã giao dịch chuyển khoản) để đối soát sao kê.
  markPaid: (id: number, payoutReference: string, note?: string) =>
    api.post<Withdrawal, { payoutReference: string; note?: string }>(
      `/admin/withdrawals/${id}/mark-paid`,
      { payoutReference, note },
    ),
};
