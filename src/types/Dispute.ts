import type { PageResponse } from "@/shared/types/api-response.type";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED" | "ESCALATED";

export type DisputeResolution =
  | "REFUND_FULL"
  | "REFUND_PARTIAL"
  | "SPLIT"
  | "RELEASE_TO_GYM"
  | "NO_ACTION"
  | "PENALTY";

/** DisputeResponse của BE (UC-063..068). */
export interface Dispute {
  id: number;
  ticketId?: number;
  /** Có khi tranh chấp nhắm vào MỘT buổi tập thay vì cả vé. */
  sessionId?: number;
  sessionDate?: string;
  ticketName?: string;
  customerName?: string;
  gymId?: number;
  gymName?: string;
  ptProfileId?: number;
  ptName?: string;
  openedByRole?: string;
  openedBy?: string;
  reason: string;
  status: DisputeStatus;
  resolution?: DisputeResolution;
  refundAmount?: number;
  frozenAmount?: number;
  moderatorNote?: string;
  /** D-12: moderator đang phụ trách (claim khi bấm "Bắt đầu xem xét"). */
  assignedModerator?: string;
  resolvedAt?: string;
  createdAt?: string;
}

export interface DisputeEvidence {
  id: number;
  description: string;
  fileUrl?: string;
  submittedBy?: string;
  createdAt?: string;
}

export interface DisputeEvidenceRequest {
  description: string;
  fileUrl?: string;
}

export interface ResolveDisputeRequest {
  resolution: DisputeResolution;
  refundAmount?: number;
  note?: string;
}

export type DisputePage = PageResponse<Dispute>;
