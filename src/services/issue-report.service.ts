import { api } from "@/services/api";
import type { PageResponse } from "@/shared/types/api-response.type";

/** UC-070: báo cáo vấn đề dịch vụ/hành vi (Gym/PT/Booking). */
export type IssueTargetType = "GYM" | "PT" | "BOOKING";
export type IssueReportStatus = "OPEN" | "RESOLVED" | "DISMISSED";

export interface IssueReport {
  id?: number;
  targetType?: IssueTargetType;
  targetId?: number;
  targetName?: string;
  reason?: string;
  status?: IssueReportStatus;
  moderatorNote?: string;
  reportedBy?: string;
  createdAt?: string;
}

export interface IssueReportInput {
  targetType: IssueTargetType;
  targetId: number;
  reason: string;
}

export const issueReportService = {
  create: (payload: IssueReportInput) =>
    api.post<IssueReport, IssueReportInput>("/issue-reports", payload),
  my: (params: { page?: number; size?: number } = {}) =>
    api.get<PageResponse<IssueReport>>("/issue-reports/my", {
      params: { page: 0, size: 20, ...params },
    }),

  // Admin/Moderator (UC-071)
  adminQueue: (params: { status?: IssueReportStatus; page?: number; size?: number } = {}) =>
    api.get<PageResponse<IssueReport>>("/admin/issue-reports", {
      params: { page: 0, size: 20, ...params },
    }),
  adminResolve: (id: number, note?: string) =>
    api.post<IssueReport, { note?: string }>(`/admin/issue-reports/${id}/resolve`, { note }),
  adminDismiss: (id: number, note?: string) =>
    api.post<IssueReport, { note?: string }>(`/admin/issue-reports/${id}/dismiss`, { note }),
};
