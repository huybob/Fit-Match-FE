import { api } from "@/services/api";

/** UC-078: tham số hệ thống chỉnh runtime (ADMIN). Chỉ update key đã seed. */
export interface SystemConfig {
  key?: string;
  value?: string;
  description?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export const systemConfigService = {
  list: () => api.get<SystemConfig[]>("/admin/system-configs"),
  update: (key: string, value: string) =>
    api.put<SystemConfig, { value: string }>(`/admin/system-configs/${key}`, { value }),
};
