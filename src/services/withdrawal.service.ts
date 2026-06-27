import { api } from "@/services/api";
import type {
  RejectWithdrawalRequest,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Withdrawal";

export type {
  RejectWithdrawalRequest,
  Withdrawal,
  WithdrawalPage,
  WithdrawalRequestDto,
  WithdrawalStatus,
} from "@/types/Withdrawal";

async function list(path: string, status?: WithdrawalStatus) {
  return api.get<WithdrawalPage>(path, {
    params: { page: 0, size: 20, status },
  });
}

export const withdrawalService = {
  getMine: (status?: WithdrawalStatus) => list("/withdrawals/me", status),
  getAll: (status?: WithdrawalStatus) => list("/withdrawals", status),
  async create(payload: WithdrawalRequestDto) {
    return api.post<Withdrawal, WithdrawalRequestDto>("/withdrawals", payload);
  },
  async approve(id: number) {
    return api.put<Withdrawal>(`/withdrawals/${id}/approve`);
  },
  async reject(id: number, payload: RejectWithdrawalRequest) {
    return api.put<Withdrawal, RejectWithdrawalRequest>(
      `/withdrawals/${id}/reject`,
      payload,
    );
  },
};
