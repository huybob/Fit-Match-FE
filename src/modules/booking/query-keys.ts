import type { BookingListParams } from "@/services/booking.service";

export const bookingKeys = {
  all: ["bookings"] as const,
  list: (scope: "customer" | "pt" | "gym", params: BookingListParams) =>
    [...bookingKeys.all, scope, params] as const,
  detail: (id: number) => [...bookingKeys.all, "detail", id] as const,
};
