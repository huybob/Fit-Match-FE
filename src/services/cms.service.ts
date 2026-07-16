import { api } from "@/services/api";

export type CmsType = "BANNER" | "FAQ" | "BLOG" | "FEATURED";

export interface CmsContent {
  id: number;
  type: CmsType;
  title: string;
  body?: string;
  imageUrl?: string;
  link?: string;
  sortOrder: number;
  published: boolean;
}

export interface CmsContentRequest {
  type: CmsType;
  title: string;
  body?: string;
  imageUrl?: string;
  link?: string;
  sortOrder?: number;
  published?: boolean;
}

export const cmsService = {
  // Public (UC-074)
  publicByType: (type: CmsType) => api.get<CmsContent[]>(`/public/cms/${type}`),
  // Admin
  list: (type?: CmsType) => api.get<CmsContent[]>("/admin/cms", { params: { type } }),
  create: (payload: CmsContentRequest) => api.post<CmsContent, CmsContentRequest>("/admin/cms", payload),
  update: (id: number, payload: CmsContentRequest) =>
    api.put<CmsContent, CmsContentRequest>(`/admin/cms/${id}`, payload),
  async remove(id: number) {
    await api.deleteRaw(`/admin/cms/${id}`);
  },
};
