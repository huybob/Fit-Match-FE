import { api } from "@/services/api";
import type {
  Bank,
  BankAccount,
  BankAccountDto,
  Wallet,
  WalletOwnerType,
  WalletTransactionPage,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Wallet";

export type {
  Bank,
  BankAccount,
  BankAccountDto,
  Wallet,
  WalletOwnerType,
  WalletTransaction,
  WalletTransactionPage,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Wallet";

/** Hai loại ví dùng chung một hình dạng API, chỉ khác tiền tố đường dẫn (V61). */
const WALLET_BASE: Record<WalletOwnerType, string> = {
  GYM: "/gym/wallet",
  CUSTOMER: "/customer/wallet",
};

/**
 * Contract BE: chủ ví dùng /{gym|customer}/wallet/**; admin/finance dùng
 * /admin/withdrawals. Duyệt 2 bước: approve (sinh QR) -> chuyển khoản -> PAID.
 * Bước PAID thường do webhook Casso tự chốt khi ngân hàng báo trừ tiền;
 * mark-paid chỉ dùng khi không tự khớp được.
 */
export const walletService = {
  // ---- Chủ ví: gym / khách hàng (UC-061/062) ----
  getWallet: (owner: WalletOwnerType = "GYM") => api.get<Wallet>(WALLET_BASE[owner]),
  getWalletTransactions: (
    owner: WalletOwnerType = "GYM",
    params: { page?: number; size?: number } = {},
  ) =>
    api.get<WalletTransactionPage>(`${WALLET_BASE[owner]}/transactions`, {
      params: { page: 0, size: 20, ...params },
    }),
  getMine: (owner: WalletOwnerType = "GYM", status?: WithdrawalStatus) =>
    api.get<WithdrawalPage>(`${WALLET_BASE[owner]}/withdrawals`, {
      params: { page: 0, size: 20, status },
    }),
  create: (owner: WalletOwnerType, payload: WithdrawalRequestDto) =>
    api.post<Withdrawal, WithdrawalRequestDto>(`${WALLET_BASE[owner]}/withdrawals`, payload),

  // ---- Tài khoản ngân hàng thụ hưởng (V61, mọi vai trò) ----
  getBanks: () => api.get<Bank[]>("/me/bank-accounts/banks"),
  getBankAccounts: () => api.get<BankAccount[]>("/me/bank-accounts"),
  createBankAccount: (payload: BankAccountDto) =>
    api.post<BankAccount, BankAccountDto>("/me/bank-accounts", payload),
  updateBankAccount: (id: number, payload: BankAccountDto) =>
    api.put<BankAccount, BankAccountDto>(`/me/bank-accounts/${id}`, payload),
  setDefaultBankAccount: (id: number) =>
    api.post<BankAccount, undefined>(`/me/bank-accounts/${id}/default`, undefined),
  deleteBankAccount: (id: number) => api.delete<void>(`/me/bank-accounts/${id}`),

  // ---- Admin / Finance (UC-062) ----
  getAll: (status?: WithdrawalStatus, ownerType?: WalletOwnerType) =>
    api.get<WithdrawalPage>("/admin/withdrawals", {
      params: { page: 0, size: 20, status, ownerType },
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
