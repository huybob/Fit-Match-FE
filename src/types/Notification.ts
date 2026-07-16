export interface NotificationPreferenceResponse {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  marketingEnabled?: boolean;
  bookingReminders?: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  emailEnabled?: boolean;
  pushEnabled?: boolean;
  marketingEnabled?: boolean;
  bookingReminders?: boolean;
}

export type NotificationCategory =
  | "BOOKING"
  | "PAYMENT"
  | "SETTLEMENT"
  | "DISPUTE"
  | "REVIEW"
  | "ACCOUNT"
  | "SYSTEM"
  | "MARKETING";

/** NotificationResponse của BE (UC-075). */
export interface NotificationItem {
  id: number;
  category: NotificationCategory;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt?: string;
}
