import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";
import type {
  NotificationItem,
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/Notification";

export type {
  NotificationCategory,
  NotificationItem,
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/Notification";

export const notificationService = {
  async getPreferences(): Promise<NotificationPreferenceResponse> {
    return api.get<NotificationPreferenceResponse>("/user/notification-preferences");
  },

  async updatePreferences(
    payload: UpdateNotificationPreferenceRequest,
  ): Promise<NotificationPreferenceResponse> {
    return api.put<NotificationPreferenceResponse, UpdateNotificationPreferenceRequest>(
      "/user/notification-preferences",
      payload,
    );
  },

  // UC-075: hộp thư in-app.
  list: (params?: { page?: number; size?: number }) =>
    api.get<PageResponse<NotificationItem>>("/notifications", {
      params: { page: 0, size: 20, ...params },
    }),
  unreadCount: () => api.get<{ count: number }>("/notifications/unread-count"),
  markRead: (id: number) => api.post<void>(`/notifications/${id}/read`),
  markAllRead: () => api.post<{ updated: number }>("/notifications/read-all"),
};
