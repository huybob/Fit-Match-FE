import { api } from "@/services/api";
import type { GymPublicProfile, PtPublicProfile } from "@/services/marketplace.service";

export const favoritesService = {
  list: () => api.get<PtPublicProfile[]>("/favorites/pts"),
  add: (ptId: number) => api.postRaw(`/favorites/pts/${ptId}`),
  remove: (ptId: number) => api.deleteRaw(`/favorites/pts/${ptId}`),

  // A-11 (audit 2026-07-17): service + DB BE hỗ trợ GYM từ đầu, giờ mới có endpoint.
  listGyms: () => api.get<GymPublicProfile[]>("/favorites/gyms"),
  addGym: (gymProfileId: number) => api.postRaw(`/favorites/gyms/${gymProfileId}`),
  removeGym: (gymProfileId: number) => api.deleteRaw(`/favorites/gyms/${gymProfileId}`),
};
