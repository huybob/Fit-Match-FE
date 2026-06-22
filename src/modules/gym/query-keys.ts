export const gymKeys = {
  all: ["gyms"] as const,
  search: (params: unknown) => [...gymKeys.all, "search", params] as const,
  detail: (id: number) => [...gymKeys.all, "detail", id] as const,
  mine: () => [...gymKeys.all, "mine"] as const,
  branches: (id: number) => [...gymKeys.all, id, "branches"] as const,
  facilities: (id: number) => [...gymKeys.all, id, "facilities"] as const,
  partnerships: () => [...gymKeys.all, "partnerships"] as const,
};
