import { api } from "@/services/api";
import type {
  Dispute,
  DisputeEvidence,
  DisputeEvidenceRequest,
  DisputePage,
  DisputeStatus,
  OpenDisputeRequest,
  ResolveDisputeRequest,
} from "@/types/Dispute";

export type {
  Dispute,
  DisputeEvidence,
  DisputeEvidenceRequest,
  DisputePage,
  DisputeResolution,
  DisputeStatus,
  OpenDisputeRequest,
  ResolveDisputeRequest,
} from "@/types/Dispute";

export const disputeService = {
  // ---- Parties: customer/gym/pt (UC-063/064) ----
  getMine: (params?: { page?: number; size?: number }) =>
    api.get<DisputePage>("/disputes", { params: { page: 0, size: 20, ...params } }),
  open: (payload: OpenDisputeRequest) =>
    api.post<Dispute, OpenDisputeRequest>("/disputes", payload),
  detail: (id: number) => api.get<Dispute>(`/disputes/${id}`),
  evidence: (id: number) => api.get<DisputeEvidence[]>(`/disputes/${id}/evidence`),
  addEvidence: (id: number, payload: DisputeEvidenceRequest) =>
    api.post<DisputeEvidence, DisputeEvidenceRequest>(`/disputes/${id}/evidence`, payload),

  // ---- Moderator/Admin (UC-065..068) ----
  getQueue: (status?: DisputeStatus, params?: { page?: number; size?: number }) =>
    api.get<DisputePage>("/admin/disputes", {
      params: { page: 0, size: 20, status, ...params },
    }),
  adminDetail: (id: number) => api.get<Dispute>(`/admin/disputes/${id}`),
  adminEvidence: (id: number) => api.get<DisputeEvidence[]>(`/admin/disputes/${id}/evidence`),
  review: (id: number) => api.post<Dispute>(`/admin/disputes/${id}/review`),
  resolve: (id: number, payload: ResolveDisputeRequest) =>
    api.post<Dispute, ResolveDisputeRequest>(`/admin/disputes/${id}/resolve`, payload),
  close: (id: number, note?: string) =>
    api.post<Dispute, { note?: string }>(`/admin/disputes/${id}/close`, { note }),
  escalate: (id: number, note?: string) =>
    api.post<Dispute, { note?: string }>(`/admin/disputes/${id}/escalate`, { note }),
};
