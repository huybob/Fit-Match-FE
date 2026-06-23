import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";

type S = components["schemas"];
export type Withdrawal = S["WithdrawalResponse"];
export type WithdrawalStatus = NonNullable<Withdrawal["status"]>;
export type WithdrawalRequestDto = S["WithdrawalRequestDto"];
export type RejectWithdrawalRequest = S["RejectWithdrawalRequest"];

async function list(path: string, status?: WithdrawalStatus) {
  const response = await axiosClient.get<S["ApiResponsePagedResponseWithdrawalResponse"]>(path, {
    params: { page: 0, size: 20, status },
  });
  return unwrapApiData(response.data);
}

export const withdrawalService = {
  getMine: (status?: WithdrawalStatus) => list("/withdrawals/me", status),
  getAll: (status?: WithdrawalStatus) => list("/withdrawals", status),
  async create(payload: WithdrawalRequestDto) {
    const response = await axiosClient.post<S["ApiResponseWithdrawalResponse"]>("/withdrawals", payload);
    return unwrapApiData(response.data);
  },
  async approve(id: number) {
    const response = await axiosClient.put<S["ApiResponseWithdrawalResponse"]>(`/withdrawals/${id}/approve`);
    return unwrapApiData(response.data);
  },
  async reject(id: number, payload: RejectWithdrawalRequest) {
    const response = await axiosClient.put<S["ApiResponseWithdrawalResponse"]>(`/withdrawals/${id}/reject`, payload);
    return unwrapApiData(response.data);
  },
};
