export const trainingSessionKeys = {
  all: ["training-sessions"] as const,
  list: (scope: "customer" | "pt", page: number) => [...trainingSessionKeys.all, scope, page] as const,
  detail: (id: number) => [...trainingSessionKeys.all, "detail", id] as const,
};
