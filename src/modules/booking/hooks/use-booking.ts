"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { bookingService, BookingListParams, CreateBookingRequest } from "@/services/booking.service";
import { bookingKeys } from "../query-keys";

function refresh(client: ReturnType<typeof useQueryClient>) {
  return () => client.invalidateQueries({ queryKey: bookingKeys.all });
}
export function useBookings(scope: "customer" | "pt" | "gym", params: BookingListParams) {
  return useQuery({
    queryKey: bookingKeys.list(scope, params),
    queryFn: () => scope === "customer" ? bookingService.getMine(params) : scope === "pt" ? bookingService.getPt(params) : bookingService.getGym(params),
  });
}
export function useBookingDetail(id: number) {
  return useQuery({ queryKey: bookingKeys.detail(id), queryFn: () => bookingService.getDetail(id), enabled: id > 0 });
}
export function useCreateBooking() {
  const c = useQueryClient();
  return useMutation({ mutationFn: (payload: CreateBookingRequest) => bookingService.create(payload), onSuccess: refresh(c) });
}
export function useBookingAction() {
  const c = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action, message }: { id: number; action: "submit" | "confirm" | "checkIn" | "complete" | "noShow" | "cancel"; message?: string }) => {
      if (action === "submit") return bookingService.submit(id);
      if (action === "confirm") return bookingService.confirm(id, { message });
      if (action === "checkIn") return bookingService.checkIn(id);
      if (action === "complete") return bookingService.complete(id);
      if (action === "noShow") return bookingService.noShow(id);
      return bookingService.cancel(id, { reason: message });
    },
    onSuccess: refresh(c),
  });
}
