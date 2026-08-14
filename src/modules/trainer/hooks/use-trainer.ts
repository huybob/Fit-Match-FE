"use client";

// Gói 2.D (audit 2026-07-17): viết lại — bản cũ bọc ~15 endpoint không tồn tại ở BE
// (mô hình PT độc lập). Chỉ giữ hook cho contract thật.

import { useQuery } from "@tanstack/react-query";
import { trainerService } from "@/services/trainer.service";
import { trainerKeys } from "../query-keys";

/** A-3: hồ sơ preview của chính PT — nguồn ptProfileId cho trang reviews. */
export function useGetMyTrainerProfile() {
  return useQuery({
    queryKey: trainerKeys.myProfile(),
    queryFn: trainerService.getMyProfilePreview,
  });
}

export function useMyVerificationStatus() {
  return useQuery({
    queryKey: trainerKeys.verification(),
    queryFn: trainerService.getVerificationStatus,
  });
}

// Lịch rảnh + thời gian chặn KHÔNG còn ở đây: câu 26 chuyển sang khai theo NGÀY
// cụ thể. Màn hình là /trainer/availability, hook nằm ở modules/ticket
// (useMyPtAvailability / useSaveMyPtAvailability).
