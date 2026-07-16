"use client";

import { useQuery } from "@tanstack/react-query";
import { trainerService } from "@/services/trainer.service";
import { trainerKeys } from "../query-keys";

/** Hồ sơ công khai của chính PT (GET /pt/profile/preview) — có id để tra review. */
export function useGetMyTrainerProfile() {
  return useQuery({
    queryKey: trainerKeys.myProfile(),
    queryFn: () => trainerService.getMyProfilePreview(),
  });
}
