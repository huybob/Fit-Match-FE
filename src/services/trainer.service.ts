import { api } from "@/services/api";
import type {
  AvailabilitySlotDto,
  BlockedTimeRequest,
  BlockedTimeResponse,
  CertificationResponse,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

export type {
  AvailabilitySlotDto,
  BlockedTimeRequest,
  BlockedTimeResponse,
  CertificationResponse,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

/**
 * Contract BE hiện tại (PT được gym tạo/quản lý — UC-007/019):
 * - GET  /pt/profile/preview        — hồ sơ công khai của chính PT (có id để tra review)
 * - PUT  /pt/profile                — PT tự sửa hồ sơ giới hạn
 * - GET  /pt/certifications         — chứng chỉ (read-only, gym quản lý)
 * - GET/PUT /pt/availability        — lịch rảnh theo tuần
 * - GET/POST/DELETE /pt/blocked-times — thời gian bận cá nhân
 */
export const trainerService = {
  getMyProfilePreview: () =>
    api.get<PtVerificationStatusResponse>("/pt/profile/preview"),

  updateMyLimitedProfile: (payload: UpdatePtProfileRequest) =>
    api.putRaw("/pt/profile", payload),

  listCertifications: () =>
    api.get<CertificationResponse[]>("/pt/certifications"),

  // ── Weekly availability (UC-028) ──
  getWeeklyAvailability: () =>
    api.get<AvailabilitySlotDto[]>("/pt/availability"),
  updateWeeklyAvailability: (slots: AvailabilitySlotDto[]) =>
    api.put<AvailabilitySlotDto[], { slots: AvailabilitySlotDto[] }>(
      "/pt/availability", { slots }),

  // ── Blocked times cá nhân (UC-029) — bỏ trống ptId/branchId ──
  listBlockedTimes: () =>
    api.get<BlockedTimeResponse[]>("/pt/blocked-times"),
  createBlockedTime: (payload: Omit<BlockedTimeRequest, "ptId" | "branchId">) =>
    api.post<BlockedTimeResponse, Omit<BlockedTimeRequest, "ptId" | "branchId">>(
      "/pt/blocked-times", payload),
  deleteBlockedTime: (id: number) => api.deleteRaw(`/pt/blocked-times/${id}`),
};
