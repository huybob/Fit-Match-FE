import { api } from "@/services/api";
import type { PtPublicProfile } from "@/services/marketplace.service";

export const favoritesService = {
  list: () => api.get<PtPublicProfile[]>("/favorites/pts"),
  add: (ptId: number) => api.postRaw(`/favorites/pts/${ptId}`),
  remove: (ptId: number) => api.deleteRaw(`/favorites/pts/${ptId}`),
};
