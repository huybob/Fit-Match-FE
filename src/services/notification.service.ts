import { api } from "@/services/api";
import type {
  NotificationPreferenceResponse,
  UpdateNotificationPreferenceRequest,
} from "@/types/Notification";

export type {
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
};
