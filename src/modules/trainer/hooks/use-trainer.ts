"use client";

// Gói 2.D (audit 2026-07-17): viết lại — bản cũ bọc ~15 endpoint không tồn tại ở BE
// (mô hình PT độc lập). Chỉ giữ hook cho contract thật.

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  trainerService,
  type AvailabilitySlot,
  type BlockedTimeInput,
} from "@/services/trainer.service";
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

// ── UC-028 (B-26): lịch rảnh hằng tuần ──
export function useMyAvailability() {
  return useQuery({
    queryKey: trainerKeys.availability(),
    queryFn: trainerService.getMyAvailability,
  });
}

export function useUpdateMyAvailability() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (slots: AvailabilitySlot[]) => trainerService.updateMyAvailability(slots),
    onSuccess: () => client.invalidateQueries({ queryKey: trainerKeys.availability() }),
  });
}

// ── UC-029 (B-29): thời gian chặn cá nhân ──
export function useMyBlockedTimes() {
  return useQuery({
    queryKey: trainerKeys.blockedTimes(),
    queryFn: trainerService.listMyBlockedTimes,
  });
}

export function useCreateMyBlockedTime() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<BlockedTimeInput, "ptId" | "branchId">) =>
      trainerService.createMyBlockedTime(payload),
    onSuccess: () => client.invalidateQueries({ queryKey: trainerKeys.blockedTimes() }),
  });
}

export function useDeleteMyBlockedTime() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => trainerService.deleteMyBlockedTime(id),
    onSuccess: () => client.invalidateQueries({ queryKey: trainerKeys.blockedTimes() }),
  });
}
