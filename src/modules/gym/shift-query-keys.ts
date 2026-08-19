/** Khoá cache cho ca làm việc, phân ca và đơn nghỉ (BE V85-V89). */
export const shiftKeys = {
  all: ["gym-shifts"] as const,
  byBranch: (branchId: number) => [...shiftKeys.all, "branch", branchId] as const,
  roster: (branchId: number, from: string, to: string) =>
    [...shiftKeys.all, "roster", branchId, from, to] as const,
};

export const leaveKeys = {
  all: ["leave-requests"] as const,
  gym: (status: string | undefined, page: number) =>
    [...leaveKeys.all, "gym", status ?? "ALL", page] as const,
  pendingCount: () => [...leaveKeys.all, "pending-count"] as const,
  policy: () => [...leaveKeys.all, "policy"] as const,
};
