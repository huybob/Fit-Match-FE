import type { PageResponse } from "@/shared/types/api-response.type";

export interface Attendance {
  id?: number;
  trainingSessionId?: number;
  customerId?: number;
  customerName?: string;
  checkInTime?: string;
  checkOutTime?: string;
  status?: "ON_TIME" | "LATE" | "ABSENT";
  sessionNotes?: string;
  createdAt?: string;
}

export type AttendancePage = PageResponse<Attendance>;
