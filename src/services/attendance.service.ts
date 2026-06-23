import { axiosClient } from "@/core/http/axios-client";
import { unwrapApiData } from "@/core/http/api-response";
import type { components } from "@/services/generated/api-contracts";
type S = components["schemas"];
export type Attendance = S["AttendanceResponse"];
export type AttendancePage = S["PagedResponseAttendanceResponse"];
export const attendanceService = {
  async getMine(page = 0) {
    const response = await axiosClient.get<S["ApiResponsePagedResponseAttendanceResponse"]>("/training/attendance/me", { params: { page, size: 12 } });
    return unwrapApiData(response.data);
  },
  async getPt(page = 0) {
    const response = await axiosClient.get<S["ApiResponsePagedResponseAttendanceResponse"]>("/training/attendance/pt", { params: { page, size: 12 } });
    return unwrapApiData(response.data);
  },
};
