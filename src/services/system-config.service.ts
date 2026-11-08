import { api } from "@/services/api";

export const PRICING_CONFIG_KEYS = {
  ticket: "gym.pricing.max-ticket-price",
  pt: "gym.pricing.max-pt-surcharge-per-day",
} as const;

export const MAX_GYM_PRICE = 9_999_999_999;

export function isPricingConfigKey(key?: string) {
  return key === PRICING_CONFIG_KEYS.ticket || key === PRICING_CONFIG_KEYS.pt;
}

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
