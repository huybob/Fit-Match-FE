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

// UC-075: hộp thư in-app.
export function useNotifications() {
  return useQuery({
    queryKey: [...notificationKeys.all, "inbox"],
    queryFn: () => notificationService.list(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: [...notificationKeys.all, "unread"],
    queryFn: () => notificationService.unreadCount(),
    refetchInterval: 60_000,
  });
}

export function useMarkNotificationRead() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => c.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

export function useMarkAllRead() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => c.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}
