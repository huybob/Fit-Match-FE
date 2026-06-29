"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationService } from "@/services/notification.service";
import { notificationKeys } from "../query-keys";

export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: notificationService.getPreferences,
  });
}

export function useUpdateNotificationPreferences() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: notificationService.updatePreferences,
    onSuccess: () => c.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
