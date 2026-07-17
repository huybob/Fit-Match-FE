import { api } from "@/services/api";
import type {
  AvailabilitySlot,
  BlockedTime,
  BlockedTimeInput,
  CertificationResponse,
  PtPublicPreview,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

export type {
  AvailabilitySlot,
  BlockedTime,
  BlockedTimeInput,
  CertificationResponse,
  PtPublicPreview,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

/**
 * Gói 2.D (audit 2026-07-17, A-13/B-26): file này từng khai ~20 endpoint KHÔNG tồn tại
 * ở BE (/pt/profile/me, /pt/services/*, /pt/availability/me*, /pt/certificates/*,
 * /pt/partnerships/* — mô hình PT độc lập cũ). Chỉ giữ contract thật:
 * PT do Gym tạo/quản lý (UC-019); PT tự sửa displayName+bio, tự quản lịch rảnh + blocked time.
 */
export const trainerService = {
  /** Preview hồ sơ public của chính PT — có id dùng cho trang reviews (A-3). */
  getMyProfilePreview: () =>
    api.get<PtPublicPreview>("/pt/profile/preview"),

  /** A-6: trạng thái xác minh thật (verificationStatus/documents/rejectionReason). */
  getVerificationStatus: () =>
    api.get<PtVerificationStatusResponse>("/pt/verification-status"),

  /** A-2: BE chỉ cho PT tự sửa displayName + bio — các field năng lực do Gym quản lý. */
  updateMyLimitedProfile: (payload: UpdatePtProfileRequest) =>
    api.putRaw("/pt/profile", payload),

  listCertifications: () =>
    api.get<CertificationResponse[]>("/pt/certifications"),

  // ── UC-028 (B-26): lịch rảnh hằng tuần — PUT thay toàn bộ (replace-all) ──
  getMyAvailability: () =>
    api.get<AvailabilitySlot[]>("/pt/availability"),
  updateMyAvailability: (slots: AvailabilitySlot[]) =>
    api.put<AvailabilitySlot[], { slots: AvailabilitySlot[] }>("/pt/availability", { slots }),

  // ── UC-029 (B-29): thời gian chặn cá nhân ──
  listMyBlockedTimes: () =>
    api.get<BlockedTime[]>("/pt/blocked-times"),
  createMyBlockedTime: (payload: Omit<BlockedTimeInput, "ptId" | "branchId">) =>
    api.post<BlockedTime, Omit<BlockedTimeInput, "ptId" | "branchId">>("/pt/blocked-times", payload),
  deleteMyBlockedTime: (id: number) =>
    api.deleteRaw(`/pt/blocked-times/${id}`),
};
