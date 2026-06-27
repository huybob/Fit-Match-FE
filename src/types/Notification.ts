import type { PageResponse } from "@/shared/types/api-response.type";

export interface Notification {
  id?: number;
  userId?: number;
  title?: string;
  body?: string;
  type?:
    | "BOOKING_CONFIRMED"
    | "BOOKING_CANCELLED"
    | "BOOKING_CHECKED_IN"
    | "BOOKING_COMPLETED"
    | "BOOKING_NO_SHOW"
    | "PAYMENT_COMPLETED"
    | "PAYMENT_FAILED"
    | "PAYMENT_REFUNDED"
    | "WITHDRAWAL_APPROVED"
    | "WITHDRAWAL_REJECTED"
    | "PARTNERSHIP_REQUEST"
    | "PARTNERSHIP_APPROVED"
    | "PARTNERSHIP_REJECTED"
    | "NEW_REVIEW"
    | "REVIEW_REPLY";
  referenceId?: number;
  referenceType?: string;
  readAt?: string;
  createdAt?: string;
  read?: boolean;
}

export interface NotificationCount {
  total?: number;
  unread?: number;
}

export type NotificationPage = PageResponse<Notification>;
