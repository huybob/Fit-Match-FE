import { api } from "@/services/api";
import type { NotificationCount, NotificationPage } from "@/types/Notification";

export type {
  Notification,
  NotificationCount,
  NotificationPage,
} from "@/types/Notification";

export const notificationService = {
  async list(page = 0) {
    return api.get<NotificationPage>("/notifications/me", {
      params: { page, size: 20 },
    });
  },
  async count() {
    return api.get<NotificationCount>("/notifications/unread-count");
  },
  async read(id: number) {
    await api.putRaw(`/notifications/${id}/read`);
  },
  async readAll() {
    await api.putRaw("/notifications/read-all");
  },
};
