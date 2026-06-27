import { api } from "@/services/api";
import type { AttendancePage } from "@/types/Attendance";

export type { Attendance, AttendancePage } from "@/types/Attendance";

export const attendanceService = {
  async getMine(page = 0) {
    return api.get<AttendancePage>("/training/attendance/me", {
      params: { page, size: 12 },
    });
  },
  async getPt(page = 0) {
    return api.get<AttendancePage>("/training/attendance/pt", {
      params: { page, size: 12 },
    });
  },
};
