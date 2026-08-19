import { api } from "@/services/api";
import type {
  CertificationResponse,
  PtPublicPreview,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

export type {
  CertificationResponse,
  PtPublicPreview,
  PtVerificationStatusResponse,
  UpdatePtProfileRequest,
} from "@/types/Trainer";

/**
 * Gói 2.D (audit 2026-07-17, A-13/B-26): file này từng khai ~20 endpoint KHÔNG tồn tại
 * ở BE (/pt/profile/me, /pt/services/*, /pt/availability/me*, /pt/certificates/*,
 * /pt/partnerships/* — mô hình PT độc lập cũ). Chỉ giữ contract thật:
 * PT do Gym tạo/quản lý (UC-019); PT tự sửa displayName+bio. Lịch làm việc do GYM
 * xếp từ BE V85 — xem services/shift.service.ts.
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

  // BE V85: PT KHÔNG còn khai lịch dưới bất kỳ hình thức nào — Gym xếp ca.
  // PT đọc ca của mình và gửi đơn xin nghỉ qua shiftService; màn hình tương ứng
  // vẫn ở /trainer/availability (modules/trainer).
};
