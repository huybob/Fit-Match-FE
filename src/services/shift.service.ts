import { api } from "@/services/api";
import type { PaginatedResult } from "@/shared/types/pagination.type";
import type {
  GymLeavePolicy,
  GymShift,
  GymShiftInput,
  PtLeaveRequest,
  PtLeaveRequestInput,
  PtShift,
  PtShiftAssignInput,
  PtShiftAssignResult,
  ShiftRosterCell,
} from "@/types/Shift";
import type { LeaveStatus } from "@/types/Shift";

export type {
  GymLeavePolicy,
  GymShift,
  GymShiftInput,
  PtLeaveRequest,
  PtLeaveRequestInput,
  PtShift,
  PtShiftAssignInput,
  PtShiftAssignResult,
  ShiftRosterCell,
} from "@/types/Shift";

/**
 * Contract BE V85-V91 — mô hình "Gym xếp ca, PT xin nghỉ".
 *
 * - Gym ca:     /gym/branches/{id}/shifts, /gym/shift-roster
 * - Gym xếp PT: /gym/pts/{ptId}/shifts
 * - Gym duyệt:  /gym/leave-requests(/{id}/approve|/reject), /gym/leave-policy
 * - PT:         /pt/shifts (read-only), /pt/leave-requests(/{id}/cancel)
 *
 * Endpoint /pt/availability/daily của mô hình cũ KHÔNG còn tồn tại ở BE — đừng
 * thêm lại wrapper cho nó (repo từng dính lỗi FE gọi API không tồn tại).
 */
export const shiftService = {
  // ---------------- Gym: ca của chi nhánh ----------------
  listShifts: (branchId: number) =>
    api.get<GymShift[]>(`/gym/branches/${branchId}/shifts`),

  createShift: (branchId: number, body: GymShiftInput) =>
    api.post<GymShift, GymShiftInput>(`/gym/branches/${branchId}/shifts`, body),

  updateShift: (branchId: number, shiftId: number, body: GymShiftInput) =>
    api.put<GymShift, GymShiftInput>(`/gym/branches/${branchId}/shifts/${shiftId}`, body),

  deleteShift: (branchId: number, shiftId: number) =>
    api.deleteRaw(`/gym/branches/${branchId}/shifts/${shiftId}`),

  // ---------------- Gym: phân ca ----------------
  roster: (branchId: number, from: string, to: string) =>
    api.get<ShiftRosterCell[]>("/gym/shift-roster", { params: { branchId, from, to } }),

  assignShift: (ptId: number, body: PtShiftAssignInput) =>
    api.post<PtShiftAssignResult, PtShiftAssignInput>(`/gym/pts/${ptId}/shifts`, body),

  unassignShift: (ptId: number, assignmentId: number) =>
    api.deleteRaw(`/gym/pts/${ptId}/shifts/${assignmentId}`),

  // ---------------- Gym: đơn nghỉ ----------------
  gymLeaveRequests: (params: { status?: LeaveStatus; page?: number; size?: number } = {}) =>
    api.get<PaginatedResult<PtLeaveRequest>>("/gym/leave-requests", {
      params: { page: 0, size: 20, ...params },
    }),

  pendingLeaveCount: () => api.get<number>("/gym/leave-requests/pending-count"),

  approveLeave: (id: number) =>
    api.post<PtLeaveRequest, Record<string, never>>(
      `/gym/leave-requests/${id}/approve`,
      {} as Record<string, never>,
    ),

  rejectLeave: (id: number, reason: string) =>
    api.post<PtLeaveRequest, { reason: string }>(`/gym/leave-requests/${id}/reject`, { reason }),

  leavePolicy: () => api.get<GymLeavePolicy>("/gym/leave-policy"),

  updateLeavePolicy: (body: GymLeavePolicy) =>
    api.put<GymLeavePolicy, GymLeavePolicy>("/gym/leave-policy", body),

  // ---------------- PT ----------------
  myShifts: (from: string, to: string) =>
    api.get<PtShift[]>("/pt/shifts", { params: { from, to } }),

  myLeaveRequests: (params: { page?: number; size?: number } = {}) =>
    api.get<PaginatedResult<PtLeaveRequest>>("/pt/leave-requests", {
      params: { page: 0, size: 20, ...params },
    }),

  submitLeave: (body: PtLeaveRequestInput) =>
    api.post<PtLeaveRequest, PtLeaveRequestInput>("/pt/leave-requests", body),

  cancelLeave: (id: number) =>
    api.post<PtLeaveRequest, Record<string, never>>(
      `/pt/leave-requests/${id}/cancel`,
      {} as Record<string, never>,
    ),
};
