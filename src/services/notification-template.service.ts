import { api } from "@/services/api";

/** UC-075: template thông báo theo sự kiện (ADMIN). Chỉ update code đã seed. */
export interface NotificationTemplate {
  code?: string;
  title?: string;
  body?: string;
  enabled?: boolean;
  placeholders?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export const notificationTemplateService = {
  list: () => api.get<NotificationTemplate[]>("/admin/notification-templates"),
  update: (code: string, payload: { title: string; body: string; enabled: boolean }) =>
    api.put<NotificationTemplate, typeof payload>(
      `/admin/notification-templates/${code}`,
      payload,
    ),
};
