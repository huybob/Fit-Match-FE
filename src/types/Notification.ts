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
