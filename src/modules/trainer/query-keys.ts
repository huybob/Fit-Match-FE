export const trainerKeys = {
  all: ["trainer"] as const,
  myProfile: () => [...trainerKeys.all, "my-profile"] as const,
  verification: () => [...trainerKeys.all, "verification"] as const,
  // BE V85: PT không khai lịch nữa. availability() và blockedTimes() của mô hình
  // cũ đã bị xoá — cả hai đều không còn consumer nào từ lâu.
  shifts: (from: string, to: string) => [...trainerKeys.all, "shifts", from, to] as const,
  leaveRequests: (page: number) => [...trainerKeys.all, "leave-requests", page] as const,
  certificates: () => [...trainerKeys.all, "certificates"] as const,
};
