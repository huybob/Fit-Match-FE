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

// BE V85: lịch PT do GYM xếp. Màn hình /trainer/availability giờ là "Lịch ca của
// tôi" (read-only) + đơn xin nghỉ; dữ liệu lấy qua shiftService, không còn hook
// khai lịch nào ở đây.
