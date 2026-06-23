export const attendanceKeys = { all: ["attendance"] as const, list: (scope: "customer" | "pt", page: number) => [...attendanceKeys.all, scope, page] as const };
